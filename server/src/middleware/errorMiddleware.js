/**
 * Error Handling Middleware Module
 * Demonstrates:
 * - 404 Not Found route handler
 * - Centralized 4-argument Express error handler: (err, req, res, next)
 * - Returning consistent JSON structure and appropriate HTTP status codes
 */

/**
 * Catches unhandled routes and forwards a 404 error
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`Resource Not Found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  console.error(`[ERROR] [${new Date().toISOString()}] ${err.message}`, err.stack || "");

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "An internal banking server error occurred.",
      statusCode: statusCode,
      path: req.originalUrl
    },
    timestamp: new Date().toISOString()
  });
}
