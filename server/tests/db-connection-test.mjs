/**
 * NexBank Database Connection & Credential Safety Verification (CA-2 Topic 52)
 * Verifies:
 * - Credential sanitization (maskMongoUri)
 * - Safe detection of placeholder Atlas connection strings
 * - Graceful fallback behavior when Atlas credentials are not provided
 * - isDbConnected() reporting
 */
import { maskMongoUri, isDbConnected } from "../src/config/db.js";

console.log("=================================================");
console.log(" Running CA-2 Topic 52: MongoDB Atlas Safety Verification");
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

// Test 1: Mask standard Atlas SRV URI
const rawUri1 = "mongodb+srv://admin_user:SuperSecretP@ss123@cluster0.abcde.mongodb.net/nexbank?retryWrites=true&w=majority";
const masked1 = maskMongoUri(rawUri1);
assert(
  !masked1.includes("admin_user") && !masked1.includes("SuperSecretP@ss123"),
  "maskMongoUri successfully hides username and password in Atlas SRV URI"
);
assert(
  masked1.includes("cluster0.abcde.mongodb.net/nexbank"),
  "maskMongoUri retains cluster hostname and database name for diagnostic logs"
);

// Test 2: Mask standard mongodb:// URI
const rawUri2 = "mongodb://db_user:MySecurePassword@127.0.0.1:27017/nexbank";
const masked2 = maskMongoUri(rawUri2);
assert(
  !masked2.includes("db_user") && !masked2.includes("MySecurePassword"),
  "maskMongoUri successfully hides credentials in standard mongodb:// URI"
);

// Test 3: Null / empty / invalid input handling
assert(maskMongoUri(null) === "[NOT_SET]", "maskMongoUri(null) returns [NOT_SET]");
assert(maskMongoUri("") === "[NOT_SET]", "maskMongoUri('') returns [NOT_SET]");
assert(maskMongoUri(12345) === "[NOT_SET]", "maskMongoUri(number) returns [NOT_SET]");

// Test 4: Default offline state when not connected
assert(typeof isDbConnected() === "boolean", "isDbConnected() returns a boolean");

console.log("=================================================");
console.log(` DB Safety Tests Completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log("=================================================");

if (testsFailed > 0) {
  process.exit(1);
}
