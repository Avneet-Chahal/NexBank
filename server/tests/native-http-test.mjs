/**
 * Native HTTP Server Test Suite (CA-2 Topic 29)
 * Tests http.createServer() functionality:
 * - Starts server on test port 5055
 * - Sends GET /api/rates and validates 200 OK + JSON headers + payload
 * - Sends GET /health and validates 200 OK
 * - Sends GET /unknown and validates 404 Not Found
 * - Sends POST /api/rates and validates 405 Method Not Allowed
 * - Shuts down server cleanly
 */
import http from "http";
import { handleNativeRequest } from "../src/examples/nativeHttpServer.js";

const TEST_PORT = 5055;
const server = http.createServer(handleNativeRequest);

console.log("=================================================");
console.log(" Running CA-2 Topic 29: Native HTTP Verification");
console.log("=================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(` [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(` [FAIL] ${message}`);
    testsFailed++;
  }
}

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(` Native test server listening on http://localhost:${TEST_PORT}`);

  try {
    // Test 1: GET /api/rates
    const ratesRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/rates",
      method: "GET"
    });

    assert(ratesRes.statusCode === 200, "GET /api/rates returns HTTP 200 OK");
    assert(
      ratesRes.headers["content-type"].includes("application/json"),
      "Response header Content-Type is application/json"
    );
    assert(
      ratesRes.headers["x-powered-by"].includes("Node.js Native HTTP"),
      "Response includes custom X-Powered-By header"
    );
    assert(ratesRes.data.success === true, "Response payload contains success: true");
    assert(Array.isArray(ratesRes.data.data.rates), "Response payload contains rates array");

    // Test 2: GET /health
    const healthRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/health",
      method: "GET"
    });

    assert(healthRes.statusCode === 200, "GET /health returns HTTP 200 OK");
    assert(healthRes.data.status === "UP", "GET /health reports status UP");

    // Test 3: GET /unregistered-route (404 Not Found)
    const notFoundRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/unregistered-route",
      method: "GET"
    });

    assert(notFoundRes.statusCode === 404, "Unknown route returns HTTP 404 Not Found");
    assert(notFoundRes.data.error === "Not Found", "404 payload contains error: Not Found");

    // Test 4: POST /api/rates (405 Method Not Allowed)
    const methodNotAllowedRes = await makeRequest({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/rates",
      method: "POST"
    });

    assert(methodNotAllowedRes.statusCode === 405, "POST /api/rates returns HTTP 405 Method Not Allowed");
  } catch (err) {
    console.error("Test execution error:", err);
    testsFailed++;
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log(" Native test server closed cleanly.");
  }

  console.log("=================================================");
  console.log(` Native HTTP Tests Completed: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("=================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
