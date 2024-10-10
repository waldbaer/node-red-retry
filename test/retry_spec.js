// --------------------------------------------------------------------------------------------------------------------
// Tests for node 'retry'
// --------------------------------------------------------------------------------------------------------------------
// Setup Infrastructure:
//   npm install --save-dev
//   npm install ~/.node-red --no-save
// Run tests
//   npm run test
// More docu:
//   - https://www.npmjs.com/package/node-red-node-test-helper
//   - https://sinonjs.org/releases/latest/assertions/
//   - https://www.chaijs.com/api/bdd/
//   - https://www.npmjs.com/package/supertest
// --------------------------------------------------------------------------------------------------------------------
const helper = require('node-red-node-test-helper');
const sinon = require('sinon');

const chrono = require('../resources/chrono.js');
const retryNode = require('../nodes/retry.js');

describe('retry node', function() {
  beforeEach(function() {
  });
  afterEach(function() {
    helper.unload();
  });

  // ==== Constants =====
  const kRetryStrategyImmediate = 'immediate';
  const kRetryStrategyFixedDelay = 'fixed_delay';
  const kRetryStrategyRandomDelay = 'random_delay';

  const kRetryStrategyFixedDelayDefault = 5; // seconds
  const kRetryStrategyRandomDelayMinDefault = 3; // seconds
  const kRetryStrategyRandomDelayMaxDefault = 10; // seconds

  const kDurationMilliseconds = 'ms';
  const kDurationSeconds = 'sec';
  const kDurationMinutes = 'min';
  const kDurationHours = 'h';

  const kDelayUnitDefault = kDurationSeconds;
  const kRetryAttemptsDefault = 3;
  const kThrowAsErrorOnLimitExceededDefault = true;

  const AcceptedDelayJitter = 10; // percent
  const PropertyPayload = 'payload';
  const PropertyError = 'error';

  const AnyInputString = 'any input string';
  const AnyErrorMessage = 'any error message';

  const ConfigErrorLog = 'Incorrect or inconsistent configuration';

  const NodeTypeRetry = 'retry';
  const NodeTypeHelper = 'helper';

  // ==== Utility Functions ====

  function getTimestamp() {
    const time = process.hrtime();
    return (time[0] * 1000) + (time[1] / 1000000);
  }

  function checkExpectedDelay(actualValue, expectedValueMin, expectedValueMax, tolerancePercent) {
    let result = false;
    const toleranceFraction = expectedValueMax * (tolerancePercent/100);
    const minExpected = expectedValueMin - toleranceFraction;
    const maxExpected = expectedValueMax + toleranceFraction;

    if (actualValue >= minExpected && actualValue <= maxExpected) {
      result = true;
    }
    if (!result) {
      should.fail(null, null,
        `The actual delay '${actualValue.toFixed(1)}ms' does not match the expected delay range ` +
        `${expectedValueMin}..${expectedValueMax} ms (+- ${tolerancePercent}%).`);
    }
    return result;
  }

  function checkNodeStatusValidMsg(retryNode) {
    retryNode.status.should.be.calledWithMatch({
      fill: 'green',
      shape: 'dot',
      text: `Stored valid msg`,
    });
  }

  function checkNodeStatusRetryAttempt(retryNode, retryAttempt, retryAttempts, delayUnit) {
    retryNode.status.should.be.calledWithMatch({
      fill: 'yellow',
      shape: 'dot',
      text: sinon.match(new RegExp(`Retry ${retryAttempt} of ${retryAttempts}.*${delayUnit}`)),
    });
  }

  function checkNodeAllRetriesFailed(retryNode, retryAttempts, origErrorMessage = undefined) {
    const retryError = `Failed after retrying ${retryAttempts} times.`;
    retryNode.status.should.be.calledWithMatch({
      fill: 'red',
      shape: 'dot',
      text: retryError,
    });

    if (retryNode.throwAsErrorOnLimitExceeded == true) {
      let rethrownErrorMessage = retryError;
      if (origErrorMessage) {
        rethrownErrorMessage = `${origErrorMessage} ([Retry] ${rethrownErrorMessage})`;
      }
      retryNode.error.should.be.calledWithMatch(rethrownErrorMessage);
    }
  }

  // ==== Flow defaults ===============================================================================================

  const FlowIdTestFlow = 'test_flow';

  const NodeIdRetry = 'retry_node_id';
  const NodeIdHelper = 'helper_node_id';

  const NodeHelper = {id: NodeIdHelper, z: FlowIdTestFlow, type: NodeTypeHelper};

  const RetryNodeDefault = {
    id: NodeIdRetry,
    type: NodeTypeRetry,
    z: FlowIdTestFlow,
    name: 'retry node test',
    retryAttempts: 2,
    retryStrategy: kRetryStrategyFixedDelay,
    retryStrategyFixedDelay: 200,
    retryStrategyFixedDelayUnit: kDurationMilliseconds,
    retryStrategyRandomDelayMin: 1000,
    retryStrategyRandomDelayMax: 2000,
    retryStrategyRandomDelayUnit: kDurationMilliseconds,
    throwAsErrorOnLimitExceeded: true,
    wires: [[NodeIdHelper]],
  };

  const FlowNodes = [
    RetryNodeDefault,
    NodeHelper,
    {id: FlowIdTestFlow, type: 'tab', label: 'Test flow'},
  ];

  // ==== Tests =======================================================================================================

  // ==== Load Tests ==========================================================

  it('should be loaded with explicitly configured valid attributes', function(done) {
    const retryConfig = FlowNodes[0];
    helper.load([retryNode], FlowNodes, function() {
      const retry = helper.getNode(NodeIdRetry);
      retry.should.have.property('name', retryConfig.name);
      retry.should.have.property('retryStrategy', retryConfig.retryStrategy);
      retry.should.have.property('retryStrategyFixedDelay', retryConfig.retryStrategyFixedDelay);
      retry.should.have.property('retryStrategyFixedDelayUnit', retryConfig.retryStrategyFixedDelayUnit);
      retry.should.have.property('retryStrategyRandomDelayMin', retryConfig.retryStrategyRandomDelayMin);
      retry.should.have.property('retryStrategyRandomDelayMax', retryConfig.retryStrategyRandomDelayMax);
      retry.should.have.property('retryStrategyRandomDelayUnit', retryConfig.retryStrategyRandomDelayUnit);
      retry.should.have.property('retryAttempts', retryConfig.retryAttempts);
      retry.should.have.property('throwAsErrorOnLimitExceeded', retryConfig.throwAsErrorOnLimitExceeded);

      done();
    });
  });

  it('should be loaded with default attributes', function(done) {
    const flow = structuredClone(FlowNodes);
    delete flow[0].name;
    delete flow[0].retryStrategy;
    delete flow[0].retryStrategyFixedDelay;
    delete flow[0].retryStrategyFixedDelayUnit;
    delete flow[0].retryStrategyRandomDelayMin;
    delete flow[0].retryStrategyRandomDelayMax;
    delete flow[0].retryStrategyRandomDelayUnit;
    delete flow[0].retryAttempts;
    delete flow[0].throwAsErrorOnLimitExceeded;

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);
      retry.should.have.property('retryStrategy', kRetryStrategyFixedDelay);
      retry.should.have.property('retryStrategyFixedDelay', kRetryStrategyFixedDelayDefault);
      retry.should.have.property('retryStrategyFixedDelayUnit', kDelayUnitDefault);
      retry.should.have.property('retryStrategyRandomDelayMin', kRetryStrategyRandomDelayMinDefault);
      retry.should.have.property('retryStrategyRandomDelayMax', kRetryStrategyRandomDelayMaxDefault);
      retry.should.have.property('retryStrategyRandomDelayUnit', kDelayUnitDefault);
      retry.should.have.property('retryAttempts', kRetryAttemptsDefault);
      retry.should.have.property('throwAsErrorOnLimitExceeded', kThrowAsErrorOnLimitExceededDefault);

      done();
    });
  });

  function genericLoadInvalidConfigTest(attribs, done) {
    const flow = structuredClone(FlowNodes);
    for (const attrib of attribs) {
      const attributeName = attrib[0];
      const attributeValue = attrib[1];
      flow[0][attributeName] = attributeValue;
    }

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);
      retry.should.have.property('_inputCallback', null);
      retry.should.have.property('_inputCallbacks', null);
      retry.error.should.be.calledWithMatch(ConfigErrorLog);
      done();
    });
  }

  it('should be not loaded with an invalid retry strategy', function(done) {
    genericLoadInvalidConfigTest([['retryStrategy', 'invalid_retry_strategy']], done);
  });

  it('should be not loaded with an invalid fixed delay', function(done) {
    genericLoadInvalidConfigTest([['retryStrategyFixedDelay', 'not_a_number']], done);
  });

  it('should be not loaded with an invalid fixed delay unit', function(done) {
    genericLoadInvalidConfigTest([['retryStrategyFixedDelayUnit', 'invalid_duration_unit']], done);
  });

  it('should be not loaded with an invalid random delay min value', function(done) {
    genericLoadInvalidConfigTest([['retryStrategyRandomDelayMin', 'not_a_number']], done);
  });

  it('should be not loaded with an invalid random delay max value', function(done) {
    genericLoadInvalidConfigTest([['retryStrategyRandomDelayMax', 'not_a_number']], done);
  });

  it('should be not loaded with a random delay min value > max value', function(done) {
    genericLoadInvalidConfigTest([
      ['retryStrategyRandomDelayMin', 5],
      ['retryStrategyRandomDelayMax', 4]], done);
  });

  it('should be not loaded with an invalid random delay unit', function(done) {
    genericLoadInvalidConfigTest([['retryStrategyRandomDelayUnit', 'invalid_duration_unit']], done);
  });

  it('should be not loaded with an invalid number of retry attempts', function(done) {
    genericLoadInvalidConfigTest([['retryAttempts', 'not_a_number']], done);
  });

  it('should be not loaded with 0 retry attempts', function(done) {
    genericLoadInvalidConfigTest([['retryAttempts', '0']], done);
  });

  it('should be not loaded with an invalid throwAsErrorOnLimitExceeded value', function(done) {
    genericLoadInvalidConfigTest([['throwAsErrorOnLimitExceeded', 'text_instead_boolean']], done);
  });

  // ==== Immediate Tests =====================================================

  function genericImmediateStrategyTest(retryAttempts, done) {
    const flow = structuredClone(FlowNodes);
    flow[0].retryStrategy = kRetryStrategyImmediate;
    flow[0].retryAttempts = retryAttempts;
    flow[0].throwAsErrorOnLimitExceeded = false;

    console.log(`Immediate strategy test with ${retryAttempts} retries`);

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);
      let startTime = null;
      let endTime = null;

      let msgCounter = 0;
      const expectedMsgCounter = retryAttempts + 2; // +1 for initial valid msg, +1 for final error msg

      retry.on('call:send', (call) => {
        // Measure and check the retry delay
        endTime = getTimestamp();
        if (startTime !== null) {
          measuredDelay = endTime - startTime;
          measuredDelay.should.be.below(20);
        }

        msgCounter++;
        console.log(`Received message #${msgCounter}`);

        // Check output messages
        call.args.should.have.lengthOf(1);
        if (msgCounter < expectedMsgCounter) {
          const msg = call.args[0];
          msg.should.have.property(PropertyPayload, AnyInputString);
          msg.should.have.property('topic', AnyInputString);
          msg.should.have.property('OtherAttribute', AnyInputString);
        } else {
          const outputMessages = call.args[0];
          outputMessages.should.have.lengthOf(2);
          const msg = outputMessages[0];
          const errorMsg = outputMessages[1];

          sinon.assert.match(msg, null);
          errorMsg.should.have.property(PropertyPayload, AnyErrorMessage);
          errorMsg.should.have.property(PropertyError, {});
        }

        // Check node status
        if (msgCounter == 1) {
          checkNodeStatusValidMsg(retry);
        } else if (msgCounter < expectedMsgCounter) {
          checkNodeStatusRetryAttempt(retry, msgCounter - 1, retryAttempts, '');
        } else {
          checkNodeAllRetriesFailed(retry, retryAttempts);
        }

        // After last expected message is received, wait some more time to assert that
        // no further messages are received.
        if (msgCounter == expectedMsgCounter) {
          setTimeout(function() {
            console.log(`Final check of msgCounter`);
            if (msgCounter == expectedMsgCounter) {
              done();
            }
          }, 500);
        }
      });

      // Initial valid message
      retry.receive({payload: AnyInputString, topic: AnyInputString, OtherAttribute: AnyInputString});

      // Then send erroneous messages
      // Send one more erroneous message to test limit of retry approaches
      for (let retryAttempt = 0; retryAttempt < retryAttempts + 1; retryAttempt++) {
        const delay = 100;
        setTimeout(function() {
          startTime = getTimestamp();
          console.log(`Send message #${retryAttempt}`);
          retry.receive({payload: AnyErrorMessage, error: { /* explicitly without 'message' */ }});
        }, delay);
      }
    });
  }

  it('should retry with immediate strategy (single retry)', function(done) {
    const retryAttempts = 1;
    genericImmediateStrategyTest(retryAttempts, done);
  });

  it('should retry with immediate strategy (multiple retries)', function(done) {
    const retryAttempts = 200;
    genericImmediateStrategyTest(retryAttempts, done);
  });

  // ==== Error Handling Tests ================================================

  it('should skip unexpected error without previous valid msg', function(done) {
    const flow = structuredClone(FlowNodes);
    flow[0].retryStrategy = kRetryStrategyImmediate;

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);

      let msgExpected = false;
      retry.on('call:send', (call) => {
        if (msgExpected) {
          const msg = call.args[0];
          msg.should.have.property(PropertyPayload, AnyInputString);
          msg.should.have.property('topic', AnyInputString);
          msg.should.have.property('OtherAttribute', AnyInputString);

          checkNodeStatusValidMsg(retry);
          done();
        } else {
          should.fail(null, null, `Initial error message must be ignored. No output expected.`);
        }
      });

      // Send error message first.
      retry.receive({payload: 'other_input', error: {message: AnyErrorMessage}});
      retry.warn.should.be.calledWithMatch(`Error reported before any valid msg. Skipping retry attempts.`);

      // Send a valid message after some time to test recovery.
      setTimeout(function() {
        msgExpected = true;
        retry.receive({payload: AnyInputString, topic: AnyInputString, OtherAttribute: AnyInputString});
      }, 500);
    });
  });

  it('should stop a running delay on reception of another message', function(done) {
    const flow = structuredClone(FlowNodes);
    flow[0].retryStrategy = kRetryStrategyFixedDelay;
    flow[0].retryStrategyFixedDelay = 500;
    flow[0].retryStrategyFixedDelayUnit = kDurationMilliseconds;

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);

      let msgCounter = 0;
      retry.on('call:send', (call) => {
        const msg = call.args[0];
        msg.should.have.property(PropertyPayload, AnyInputString);
        msg.should.have.property('topic', AnyInputString);
        msg.should.have.property('OtherAttribute', AnyInputString);

        msgCounter++;
      });

      // Initial valid message
      retry.receive({payload: AnyInputString, topic: AnyInputString, OtherAttribute: AnyInputString});
      // First error message
      retry.receive({payload: AnyInputString, error: {message: AnyErrorMessage}});

      // Second error message while delay of first message is running
      setTimeout(function() {
        retry.receive({payload: AnyInputString, error: {message: AnyErrorMessage}});
      }, 250);

      // Another valid message
      setTimeout(function() {
        retry.receive({payload: AnyInputString, topic: AnyInputString, OtherAttribute: AnyInputString});
      }, 500);

      // Final check
      setTimeout(function() {
        if (msgCounter == 2) {
          done();
        } else {
          should.fail(null, null, `Second error message must cancel delay trigger by first error.`);
        }
      }, 1500);
    });
  });

  // ==== Fixed & Random Delay Tests ==========================================

  function genericDelayTest(retryStrategy, retryAttempts, delayMin, delayMax, delayUnit, done) {
    const flow = structuredClone(FlowNodes);
    flow[0].retryStrategy = retryStrategy;
    flow[0].retryAttempts = retryAttempts;
    flow[0].retryStrategyFixedDelay = delayMin;
    flow[0].retryStrategyFixedDelayUnit = delayUnit;
    flow[0].retryStrategyRandomDelayMin = delayMin;
    flow[0].retryStrategyRandomDelayMax = delayMax;
    flow[0].retryStrategyRandomDelayUnit = delayUnit;

    const delayMinMilliseconds = chrono.toMilliseconds(delayMin, delayUnit);
    const delayMaxMilliseconds = chrono.toMilliseconds(delayMax, delayUnit);

    console.log(`${retryStrategy} test with ${retryAttempts} retries, ${delayMin}..${delayMax} ${delayUnit}`);

    helper.load([retryNode], flow, function() {
      const retry = helper.getNode(NodeIdRetry);
      let startTime = null;
      let endTime = null;

      let msgCounter = 0;
      const expectedMsgCounter = retryAttempts + 2; // +1 for initial valid msg, +1 for final error msg

      retry.on('call:send', (call) => {
        endTime = getTimestamp();

        msgCounter++;
        console.log(`Received message #${msgCounter}`);

        // Measure and check the retry delay
        if ((startTime !== null) && (msgCounter < expectedMsgCounter)) {
          measuredDelay = endTime - startTime;
          console.log(`Measured delay: ${measuredDelay.toFixed(1)}ms`);
          checkExpectedDelay(measuredDelay, delayMinMilliseconds, delayMaxMilliseconds, AcceptedDelayJitter);
        }

        // Check output messages
        call.args.should.have.lengthOf(1);
        if (msgCounter < expectedMsgCounter) {
          const msg = call.args[0];
          msg.should.have.property(PropertyPayload, AnyInputString);
          msg.should.have.property('topic', AnyInputString);
          msg.should.have.property('OtherAttribute', AnyInputString);
        } else {
          const outputMessages = call.args[0];
          outputMessages.should.have.lengthOf(2);
          const msg = outputMessages[0];
          const errorMsg = outputMessages[1];

          sinon.assert.match(msg, null);
          errorMsg.should.have.property(PropertyPayload, AnyErrorMessage);
          errorMsg.should.have.property(PropertyError,
            {message: `${AnyErrorMessage} ([Retry] Failed after retrying ${retryAttempts} times.)`});
        }

        if (msgCounter == 1) {
          checkNodeStatusValidMsg(retry);
        } else if (msgCounter < expectedMsgCounter) {
          checkNodeStatusRetryAttempt(retry, msgCounter - 1, retryAttempts, delayUnit);
        } else {
          checkNodeAllRetriesFailed(retry, retryAttempts);
        }

        // After last expected message is received, wait some more time to assert that
        // no further messages are received.
        if (msgCounter == expectedMsgCounter) {
          setTimeout(function() {
            console.log(`Final check of msgCounter`);
            if (msgCounter == expectedMsgCounter) {
              done();
            }
          }, 2 * delayMaxMilliseconds);
        }
      });

      // Initial valid message
      retry.receive({payload: AnyInputString, topic: AnyInputString, OtherAttribute: AnyInputString});

      // Then send erroneous messages (after the regular fixedDelay expired)
      // Send one more erroneous message to test limit of retry approaches
      for (let retryAttempt = 0; retryAttempt < retryAttempts + 1; retryAttempt++) {
        const delay = (2 * retryAttempt * delayMaxMilliseconds) + 100;
        setTimeout(function() {
          startTime = getTimestamp();
          console.log(`Send error message #${retryAttempt}`);
          retry.receive({payload: AnyErrorMessage, error: {message: AnyErrorMessage}});
        }, delay);
      }
    });
  }

  it('should retry with fixed delay (milliseconds)', function(done) {
    const retryStrategy = kRetryStrategyFixedDelay;
    const retryAttempts = 6;
    const fixedDelay = 200;
    const fixedDelayUnit = kDurationMilliseconds;

    genericDelayTest(retryStrategy, retryAttempts, fixedDelay, fixedDelay, fixedDelayUnit, done);
  });

  it('should retry with fixed delay (seconds)', function(done) {
    const retryStrategy = kRetryStrategyFixedDelay;
    const retryAttempts = 2;
    const fixedDelay = 0.6;
    const fixedDelayUnit = kDurationSeconds;

    genericDelayTest(retryStrategy, retryAttempts, fixedDelay, fixedDelay, fixedDelayUnit, done);
  });

  it('should retry with fixed delay (minutes)', function(done) {
    const retryStrategy = kRetryStrategyFixedDelay;
    const retryAttempts = 2;
    const fixedDelay = 0.8/60;
    const fixedDelayUnit = kDurationMinutes;

    genericDelayTest(retryStrategy, retryAttempts, fixedDelay, fixedDelay, fixedDelayUnit, done);
  });

  it('should retry with fixed delay (hours)', function(done) {
    const retryStrategy = kRetryStrategyFixedDelay;
    const retryAttempts = 1;
    const fixedDelay = 2/3600;
    const fixedDelayUnit = kDurationHours;

    genericDelayTest(retryStrategy, retryAttempts, fixedDelay, fixedDelay, fixedDelayUnit, done);
  });

  it('should retry with random delay (milliseconds)', function(done) {
    const retryStrategy = kRetryStrategyRandomDelay;
    const retryAttempts = 1;
    const randomDelayMin = 200;
    const randomDelayMax = 400;
    const delayUnit = kDurationMilliseconds;

    genericDelayTest(retryStrategy, retryAttempts, randomDelayMin, randomDelayMax, delayUnit, done);
  });

  it('should retry with random delay (milliseconds, identical min/max)', function(done) {
    const retryStrategy = kRetryStrategyRandomDelay;
    const retryAttempts = 2;
    const randomDelayMin = 500;
    const randomDelayMax = 500;
    const delayUnit = kDurationMilliseconds;

    genericDelayTest(retryStrategy, retryAttempts, randomDelayMin, randomDelayMax, delayUnit, done);
  });

  it('should retry with random delay (seconds)', function(done) {
    const retryStrategy = kRetryStrategyRandomDelay;
    const retryAttempts = 3;
    const randomDelayMin = 0.3;
    const randomDelayMax = 0.7;
    const delayUnit = kDurationSeconds;

    genericDelayTest(retryStrategy, retryAttempts, randomDelayMin, randomDelayMax, delayUnit, done);
  });

  it('should retry with random delay (minutes)', function(done) {
    const retryStrategy = kRetryStrategyRandomDelay;
    const retryAttempts = 2;
    const randomDelayMin = 0.5/60;
    const randomDelayMax = 1/60;
    const delayUnit = kDurationMinutes;

    genericDelayTest(retryStrategy, retryAttempts, randomDelayMin, randomDelayMax, delayUnit, done);
  });

  it('should retry with random delay (hours)', function(done) {
    const retryStrategy = kRetryStrategyRandomDelay;
    const retryAttempts = 2;
    const randomDelayMin = 0.1/3600;
    const randomDelayMax = 1.0/3600;
    const delayUnit = kDurationHours;

    genericDelayTest(retryStrategy, retryAttempts, randomDelayMin, randomDelayMax, delayUnit, done);
  });
});
