/**
 * NexBank Native HTTP Server Demonstration (CA-2 Topic 29)
 * Demonstrates:
 * - http.createServer() without Express or third-party web frameworks
 * - Native request handling (req.method, req.url, req.headers)
 * - Setting HTTP status codes (res.statusCode)
 * - Setting HTTP response headers (res.setHeader)
 * - Sending JSON payloads (res.end(JSON.stringify(...)))
 * - Basic routing and 404 / 405 fallback handling
 * - Isolated execution on port 5050 (avoids conflicting with Express on 5000 or Vite on 5173)
 */
import http from "http";

const PORT = process.env.NATIVE_HTTP_PORT || 5050;

// Sample banking interest rate data served via native HTTP
const BANKING_RATES = {
  institution: "NexBank Central Services",
  rates: [
    { type: "Savings Account", annualPercentageYield: "4.50%", minimumBalance: "₹10,000" },
    { type: "Fixed Deposit (1 Year)", annualPercentageYield: "7.10%", minimumBalance: "₹25,000" },
    { type: "Senior Citizen FD", annualPercentageYield: "7.60%", minimumBalance: "₹25,000" },
    { type: "Recurring Deposit", annualPercentageYield: "6.85%", minimumBalance: "₹1,000/mo" }
  ],
  effectiveDate: new Date().toISOString()
};

/**
 * Native HTTP Request Handler
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export function handleNativeRequest(req, res) {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // Set default JSON response headers
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Powered-By", "Node.js Native HTTP Module (CA-2 Topic 29)");

  // Route: GET /
  if (pathname === "/" && method === "GET") {
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        message: "NexBank Native HTTP Microservice is operational",
        endpoints: {
          rates: "GET /api/rates",
          health: "GET /health"
        },
        timestamp: new Date().toISOString()
      })
    );
  }

  // Route: GET /api/rates
  if (pathname === "/api/rates" && method === "GET") {
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        data: BANKING_RATES,
        timestamp: new Date().toISOString()
      })
    );
  }

  // Route: GET /health
  if (pathname === "/health" && method === "GET") {
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        status: "UP",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      })
    );
  }

  // Handle unsupported methods on existing routes
  if (["/", "/api/rates", "/health"].includes(pathname) && method !== "GET") {
    res.statusCode = 405;
    return res.end(
      JSON.stringify({
        success: false,
        error: "Method Not Allowed",
        allowedMethods: ["GET"]
      })
    );
  }

  // Route: 404 Fallback
  res.statusCode = 404;
  return res.end(
    JSON.stringify({
      success: false,
      error: "Not Found",
      message: `The native HTTP server does not handle route: ${pathname}`
    })
  );
}

// Create native HTTP server instance
export const server = http.createServer(handleNativeRequest);

// Start listening if run directly
if (process.argv[1] && process.argv[1].endsWith("nativeHttpServer.js")) {
  server.listen(PORT, () => {
    console.log("=================================================");
    console.log(" NexBank Native HTTP Server Running (CA-2 Topic 29)");
    console.log(` Port:    http://localhost:${PORT}`);
    console.log(` Rates:   http://localhost:${PORT}/api/rates`);
    console.log(` Health:  http://localhost:${PORT}/health`);
    console.log(" Note: Express server remains on port 5000");
    console.log("=================================================");
  });

  // Handle clean process termination
  process.on("SIGINT", () => {
    console.log("\n[SHUTDOWN] Closing native HTTP server...");
    server.close(() => {
      console.log("[SHUTDOWN] Native HTTP server closed.");
      process.exit(0);
    });
  });
}
