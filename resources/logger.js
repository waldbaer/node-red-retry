// Export logger functions for shared usage in backend (node.js) and frontend (browser)

(function(exports) {
  const LoggerNodeName = `Retry`;

  exports.logWarning = function(message, node = undefined, msg = undefined) {
    if (node !== undefined) {
      node.warn(`[${LoggerNodeName}] ${message}`, msg);
    } else {
      console.warn(`[${LoggerNodeName}] ${message}`);
    }
  };

  exports.logError = function(message, node = undefined, msg = undefined) {
    if (node !== undefined) {
      node.error(`[${LoggerNodeName}] ${message}`, msg);
    } else {
      console.error(`[${LoggerNodeName}] ${message}`);
    }
  };
// eslint-disable-next-line no-invalid-this
})(/* istanbul ignore next */ typeof exports === 'undefined' ? this['logger'] = {} : exports);
