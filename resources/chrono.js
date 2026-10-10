// Export chrono functions for shared usage in backend (node.js) and frontend (browser)

(function (exports) {
  // ---- Constants ----
  const kDurationMilliseconds = 'ms';
  const kDurationSeconds = 'sec';
  const kDurationMinutes = 'min';
  const kDurationHours = 'h';
  const kSupportedDurations = [
    kDurationMilliseconds,
    kDurationSeconds,
    kDurationMinutes,
    kDurationHours,
  ];

  exports.kDurationMilliseconds = kDurationMilliseconds;
  exports.kDurationSeconds = kDurationSeconds;
  exports.kDurationMinutes = kDurationMinutes;
  exports.kDurationHours = kDurationHours;
  exports.kSupportedDurations = kSupportedDurations;

  // ---- Utility Functions ----

  exports.toMilliseconds = function (duration, unit) {
    let durationMilliseconds = duration;
    switch (unit) {
      case kDurationHours:
        durationMilliseconds *= 60; // hours -> minutes
        // Falls through. Continue step-wise conversion.
      case kDurationMinutes:
        durationMilliseconds *= 60; // minutes -> seconds
        // Falls through. Continue step-wise conversion.
      case kDurationSeconds:
        durationMilliseconds *= 1000; // seconds -> milliseconds
        // Falls through. Continue step-wise conversion.
      case kDurationMilliseconds:
      default:
        // No further conversion necessary.
        break;
    }
    return durationMilliseconds;
  };

  exports.fromMilliseconds = function (durationMilliseconds, unit) {
    let duration = durationMilliseconds;
    switch (unit) {
      case kDurationHours:
        duration /= 60; // minutes -> hours
        // Falls through. Continue step-wise conversion.
      case kDurationMinutes:
        duration /= 60; // seconds -> minutes
        // Falls through. Continue step-wise conversion.
      case kDurationSeconds:
        duration /= 1000; // milliseconds -> seconds
        // Falls through. Continue step-wise conversion.
      case kDurationMilliseconds:
      default:
        // No further conversion necessary.
        break;
    }
    return duration;
  };
})(/* istanbul ignore next */ typeof exports === 'undefined' ? this['chrono'] = {} : exports);
