/**
 * Logging Service
 * Provides secure logging with sensitive data filtering
 * Requirement 19.4: Log errors without exposing sensitive information
 */

/**
 * Sensitive field patterns to filter from logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /bearer/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /private[_-]?key/i
];

/**
 * Sensitive value patterns to redact
 */
const SENSITIVE_VALUE_PATTERNS = [
  /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/, // JWT tokens
  /^[0-9a-f]{32,}$/i, // Long hex strings (likely tokens)
  /^sk_[a-zA-Z0-9]+$/, // Secret keys
  /^pk_[a-zA-Z0-9]+$/, // Public keys
];

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Current log level (can be configured via environment)
 */
const currentLogLevel = process.env.LOG_LEVEL || LogLevel.INFO;

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3
};

/**
 * Check if a field name is sensitive
 * @param {string} key - Field name to check
 * @returns {boolean} True if field is sensitive
 */
function isSensitiveField(key) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Check if a value looks sensitive
 * @param {*} value - Value to check
 * @returns {boolean} True if value looks sensitive
 */
function isSensitiveValue(value) {
  if (typeof value !== 'string') return false;
  return SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Sanitize an object by removing or redacting sensitive fields
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {*} Sanitized object
 */
function sanitize(obj, depth = 0, maxDepth = 5) {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[Max Depth Reached]';
  }

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    // Check if string value looks sensitive
    if (isSensitiveValue(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1, maxDepth));
  }

  // Handle Error objects specially
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: process.env.NODE_ENV === 'development' ? obj.stack : undefined,
      code: obj.code
    };
  }

  // Handle regular objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (isSensitiveValue(value)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitize(value, depth + 1, maxDepth);
    }
  }
  return sanitized;
}

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, context) {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? sanitize(context) : {};
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...sanitizedContext
  };

  return JSON.stringify(logEntry);
}

/**
 * Check if a log level should be logged based on current log level
 * @param {string} level - Log level to check
 * @returns {boolean} True if should log
 */
function shouldLog(level) {
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[currentLogLevel];
}

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {Object} context - Additional context (will be sanitized)
 */
export function logError(message, context = {}) {
  if (!shouldLog(LogLevel.ERROR)) return;
  
  const formattedMessage = formatLogMessage(LogLevel.ERROR, message, context);
  console.error(formattedMessage);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {Object} context - Additional context (will be sanitized)
 */
export function logWarn(message, context = {}) {
  if (!shouldLog(LogLevel.WARN)) return;
  
  const formattedMessage = formatLogMessage(LogLevel.WARN, message, context);
  console.warn(formattedMessage);
}

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} context - Additional context (will be sanitized)
 */
export function logInfo(message, context = {}) {
  if (!shouldLog(LogLevel.INFO)) return;
  
  const formattedMessage = formatLogMessage(LogLevel.INFO, message, context);
  console.log(formattedMessage);
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} context - Additional context (will be sanitized)
 */
export function logDebug(message, context = {}) {
  if (!shouldLog(LogLevel.DEBUG)) return;
  
  const formattedMessage = formatLogMessage(LogLevel.DEBUG, message, context);
  console.log(formattedMessage);
}

/**
 * Create a logger instance with a specific context
 * Useful for adding consistent context to all logs from a module
 * 
 * @param {Object} defaultContext - Default context to include in all logs
 * @returns {Object} Logger instance with error, warn, info, debug methods
 * 
 * @example
 * const logger = createLogger({ service: 'postService' });
 * logger.error('Failed to create post', { userId: '123', error });
 */
export function createLogger(defaultContext = {}) {
  return {
    error: (message, context = {}) => logError(message, { ...defaultContext, ...context }),
    warn: (message, context = {}) => logWarn(message, { ...defaultContext, ...context }),
    info: (message, context = {}) => logInfo(message, { ...defaultContext, ...context }),
    debug: (message, context = {}) => logDebug(message, { ...defaultContext, ...context })
  };
}

/**
 * Log an HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function logRequest(req, res) {
  const context = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  if (res.statusCode >= 400) {
    logError('HTTP request failed', context);
  } else {
    logInfo('HTTP request', context);
  }
}

/**
 * Express middleware for request logging
 * @returns {Function} Express middleware
 * 
 * @example
 * app.use(requestLogger());
 */
export function requestLogger() {
  return (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to log after response is sent
    res.end = function(...args) {
      logRequest(req, res);
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Express middleware for error logging
 * @returns {Function} Express middleware
 * 
 * @example
 * app.use(errorLogger());
 */
export function errorLogger() {
  return (err, req, res, next) => {
    logError('Unhandled error', {
      error: err,
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      ip: req.ip
    });
    
    next(err);
  };
}

// Default export
export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  createLogger,
  requestLogger,
  errorLogger,
  LogLevel
};
