// Export chrono functions for shared usage in backend (node.js) and frontend (browser)

(function(exports) {
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

  exports.toMilliseconds = function(duration, unit) {
    let durationMilliseconds = duration;
    switch (unit) {
    case kDurationHours:
      durationMilliseconds *= 60; // hours -> minutes
      // No break. Continue step-wise conversion.
    case kDurationMinutes:
      durationMilliseconds *= 60; // minutes -> seconds
      // No break. Continue step-wise conversion.
    case kDurationSeconds:
      durationMilliseconds *= 1000; // seconds -> milliseconds
      // No break. Continue step-wise conversion.
    case kDurationMilliseconds:
      // No further conversion necessary.
    default:
      // No further conversion necessary.
      break;
    }
    return durationMilliseconds;
  };

  exports.fromMilliseconds = function(durationMilliseconds, unit) {
    let duration = durationMilliseconds;
    switch (unit) {
    case kDurationHours:
      duration /= 60; // minutes -> hours
      // No break. Continue step-wise conversion.
    case kDurationMinutes:
      duration /= 60; // seconds -> minutes
      // No break. Continue step-wise conversion.
    case kDurationSeconds:
      duration /= 1000; // milliseconds -> seconds
      // No break. Continue step-wise conversion.
    case kDurationMilliseconds:
      // No further conversion necessary.
    default:
      // No further conversion necessary.
      break;
    }
    return duration;
  };
// eslint-disable-next-line no-invalid-this
})(/* istanbul ignore next */ typeof exports === 'undefined' ? this['chrono'] = {} : exports);
