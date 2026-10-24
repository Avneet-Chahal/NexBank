/**
 * Request Logger Middleware
 * Demonstrates:
 * - Express middleware pattern: (req, res, next)
 * - Request object inspection: req.method, req.originalUrl, req.ip
 * - Node EventEmitter: listening to response 'finish' event to measure response latency
 * - Passing control to next middleware with next()
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Listen to response finish event (Node.js EventEmitter)
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logPrefix = statusCode >= 400 ? "WARN" : "INFO";

    console.log(
      `[${timestamp}] [${logPrefix}] ${req.method} ${req.originalUrl} - Status: ${statusCode} (${duration}ms)`
    );
  });

  next();
}
