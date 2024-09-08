module.exports = function(RED) {
  const logger = require('../resources/logger');
  const chrono = require('../resources/chrono');

  // ---- elements of the reference config ----

  // ---- elements of the node ----
  const kRetryStrategyImmediate = 'immediate';
  const kRetryStrategyFixedDelay = 'fixed_delay';
  const kRetryStrategyRandomDelay = 'random_delay';
  const kSupportedRetryStrategies = [
    kRetryStrategyImmediate,
    kRetryStrategyFixedDelay,
    kRetryStrategyRandomDelay];

  const kRetryStrategyDefault = kRetryStrategyFixedDelay;

  const kRetryStrategyFixedDelayDefault = 5; // seconds
  const kRetryStrategyRandomDelayMinDefault = 3; // seconds
  const kRetryStrategyRandomDelayMaxDefault = 10; // seconds

  const kDelayUnitDefault = chrono.kDurationSeconds;

  const kRetryAttemptsDefault = 3;

  // ---- Utility functions -----------------------------------------------------------------------
  function getConfig(node, nodeConfig) {
    let result = true;
    node.name = nodeConfig.name;
    node.retryStrategy = nodeConfig.retryStrategy || kRetryStrategyDefault;
    getOptionalNumberConfig(node, nodeConfig, 'retryStrategyFixedDelay', kRetryStrategyFixedDelayDefault);
    getOptionalDurationUnit(node, nodeConfig, 'retryStrategyFixedDelayUnit', kDelayUnitDefault);

    getOptionalNumberConfig(node, nodeConfig, 'retryStrategyRandomDelayMin', kRetryStrategyRandomDelayMinDefault);
    getOptionalNumberConfig(node, nodeConfig, 'retryStrategyRandomDelayMax', kRetryStrategyRandomDelayMaxDefault);
    getOptionalDurationUnit(node, nodeConfig, 'retryStrategyRandomDelayUnit', kDelayUnitDefault);

    getOptionalNumberConfig(node, nodeConfig, 'retryAttempts', kRetryAttemptsDefault);

    if (// Retry Strategy
      !kSupportedRetryStrategies.includes(nodeConfig.retryStrategy) ||
      // Fixed Delay
      isNaN(node.retryStrategyFixedDelay) || node.retryStrategyFixedDelayUnit === undefined ||
      // Random Delay
      isNaN(node.retryStrategyRandomDelayMin) || isNaN(node.retryStrategyRandomDelayMax) ||
      (node.retryStrategyRandomDelayMin > node.retryStrategyRandomDelayMax) ||
      node.retryStrategyRandomDelayUnit === undefined ||
      // Retry Attempts
      isNaN(node.retryAttempts) || node.retryAttempts < 1) {
      result = false;
    }

    return result;
  }

  function getOptionalNumberConfig(node, nodeConfig, attributeName, defaultValue) {
    node[attributeName] = defaultValue;
    if (nodeConfig.hasOwnProperty(attributeName)) {
      node[attributeName] = parseFloat(nodeConfig[attributeName]);
    }
  }

  function getOptionalDurationUnit(node, nodeConfig, attributeName, defaultValue) {
    node[attributeName] = defaultValue;
    if (nodeConfig.hasOwnProperty(attributeName)) {
      if (chrono.kSupportedDurations.includes(nodeConfig[attributeName])) {
        node[attributeName] = nodeConfig[attributeName];
      } else {
        node[attributeName] = undefined;
      }
    }
  }

  function reportIncorrectConfiguration(node) {
    logger.logError(`Incorrect or inconsistent configuration of retry node ` +
                    `'${node.name}' with ID ${node.id}. Skipping further processing.`, node);
  }

  function checkIsErrorMsg(node, msg) {
    return msg.error !== undefined;
  }

  function determineDelay(node) {
    if (node.retryStrategy === kRetryStrategyFixedDelay) {
      const delay = node.retryStrategyFixedDelay;
      const delayUnit = node.retryStrategyFixedDelayUnit;
      const delayMilliseconds = chrono.toMilliseconds(delay, delayUnit);
      return [delayMilliseconds, delay, delayUnit];
    } else if (node.retryStrategy === kRetryStrategyRandomDelay) {
      const delayUnit = node.retryStrategyRandomDelayUnit;
      const delayMin = node.retryStrategyRandomDelayMin;
      const delayMinMilliseconds = chrono.toMilliseconds(delayMin, delayUnit);
      const delayMax = node.retryStrategyRandomDelayMax;
      const delayMaxMilliseconds = chrono.toMilliseconds(delayMax, delayUnit);

      const delayMilliseconds = Math.round(Math.random() * (delayMaxMilliseconds - delayMinMilliseconds) + delayMinMilliseconds);
      const delay = chrono.fromMilliseconds(delayMilliseconds, delayUnit);
      return [delayMilliseconds, delay, delayUnit];
    } else {
      return [0, 0, chrono.kDurationMilliseconds]; // immediate strategy by default
    }
  }

  function startTimer(func, delay) {
    if (delay > 0) {
      return setTimeout(func, delay);
    } else {
      func();
      return null;
    }
  }

  function stopTimer(node) {
    if (node.timerHandle !== null) {
      clearTimeout(node.timerHandle);
    }
  }

  function handleValidMsg(node, msg) {
    stopTimer(node);

    node.lastValidMsg = RED.util.cloneMessage(msg);
    node.retryCounter = 0;
    node.timerHandle = undefined;

    node.status({
      fill: `green`,
      shape: 'dot',
      text: `Stored valid msg`,
    });

    node.send(msg);
  }

  function handleErrorMsg(node, msg) {
    if (node.lastValidMsg !== null) {
      stopTimer(node);

      if (node.retryCounter < node.retryAttempts) {
        node.retryCounter++;

        const [delayMilliseconds, delay, delayUnit] = determineDelay(node);

        let statusText = `Retry ${node.retryCounter} of ${node.retryAttempts}`;
        if (delayMilliseconds > 0) {
          statusText += ` in ${delay.toFixed(1)} ${delayUnit}`;
        }
        node.status({fill: `yellow`, shape: 'dot', text: statusText});

        node.timerHandle = startTimer(function() {
          node.send(node.lastValidMsg);
        }, delayMilliseconds);
      } else {
        const errorText = `Failed after retrying ${node.retryCounter} times.`;
        node.status({fill: `red`, shape: 'dot', text: errorText});

        let rethrownErrorText = errorText;
        if  (msg.error.message !== undefined) {
          rethrownErrorText = `${msg.error.message} ([Retry] ${rethrownErrorText})`;
        }
        node.error(rethrownErrorText, msg);
      }
    } else {
      logger.logWarning(`Error reported before any valid msg. Skipping retry attempts.`, node, msg);
    }
  }

  // ---- Node main -------------------------------------------------------------------------------
  RED.nodes.registerType('retry', function(nodeConfig) {
    // eslint-disable-next-line no-invalid-this
    const node = this;
    RED.nodes.createNode(node, nodeConfig);

    // ---- Instance-specific states ----
    node.lastValidMsg = null;
    node.retryCounter = 0;
    node.timerHandle = null;

    // ---- Get node settings and referenced config properties ----
    const configValid = getConfig(node, nodeConfig);
    if (!configValid) {
      reportIncorrectConfiguration(node);
      return null;
    }

    // ---- Handling incoming messages ----
    node.on('input', function(msg) {
      const isError = checkIsErrorMsg(node, msg);
      if (!isError) {
        handleValidMsg(node, msg);
      } else {
        handleErrorMsg(node, msg);
      }
    });
  });
};
