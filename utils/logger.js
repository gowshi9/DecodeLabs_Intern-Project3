/**
 * Logger module.
 * Wraps console methods to allow unified log formatting and prevent direct calls to console.log in production-ready code.
 */
const logger = {
  /**
   * Logs informational messages.
   * Used to trace expected operational milestones (e.g. server start, successful DB connection) without cluttering stdout.
   * @param {string} message - Message text.
   * @param {any} [meta] - Accompanying diagnostic data.
   */
  info: (message, meta) => {
    if (meta) {
      console.info(`[INFO] ${message}`, meta);
    } else {
      console.info(`[INFO] ${message}`);
    }
  },

  /**
   * Logs warning messages.
   * Used to capture non-fatal anomalies (e.g. failed validation, API rate-limiting) that require administrator attention.
   * @param {string} message - Message text.
   * @param {any} [meta] - Accompanying diagnostic data.
   */
  warn: (message, meta) => {
    if (meta) {
      console.warn(`[WARN] ${message}`, meta);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  /**
   * Logs error messages.
   * Used to capture database connection errors or route crashes to ensure proper error visibility and system recovery tracking.
   * @param {string} message - Message text.
   * @param {any} [meta] - Accompanying error stack or context.
   */
  error: (message, meta) => {
    if (meta) {
      console.error(`[ERROR] ${message}`, meta);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
};

module.exports = logger;
