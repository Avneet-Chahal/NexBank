/**
 * NexBank Streams Verification Test (CA-2 Topic 26)
 * Demonstrates:
 * - fs.createReadStream() (Node.js Readable stream)
 * - Custom and file Writable streams
 * - stream.pipeline() for memory-safe data transmission
 * - Event handling ('data', 'end', 'finish', 'error')
 * - Stream cleanup and error resilience
 */
import fs from "fs";
import path from "path";
import { Writable, pipeline } from "stream";
import { promisify } from "util";
import { fileURLToPath } from "url";

const pipelineAsync = promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleCsvPath = path.resolve(__dirname, "../src/data/sample_statement.csv");

console.log("=================================================");
console.log(" Running CA-2 Topic 26: Node.js Streams Verification");
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

async function runTests() {
  // Test 1: Verify sample statement source file exists
  assert(fs.existsSync(sampleCsvPath), `Sample CSV exists at: ${sampleCsvPath}`);

  // Test 2: Read sample statement via fs.createReadStream and pipe to Writable stream using pipeline
  let chunksCollected = [];
  let bytesReceived = 0;

  const memorySink = new Writable({
    write(chunk, encoding, callback) {
      chunksCollected.push(chunk);
      bytesReceived += chunk.length;
      callback();
    }
  });

  const readStream = fs.createReadStream(sampleCsvPath);

  try {
    await pipelineAsync(readStream, memorySink);
    const completeContent = Buffer.concat(chunksCollected).toString("utf-8");

    assert(bytesReceived > 0, `Streamed ${bytesReceived} bytes through pipeline`);
    assert(completeContent.includes("TX-SAMPLE-001"), "Streamed content contains valid sample transaction IDs");
    assert(completeContent.includes("Balance (INR)"), "Streamed content contains expected CSV header");
  } catch (err) {
    assert(false, `Pipeline failed unexpectedly: ${err.message}`);
  }

  // Test 3: Verify readStream cleanup after completion
  assert(readStream.destroyed, "Readable stream was properly destroyed/closed after pipeline completion");

  // Test 4: Stream error handling with missing source file
  const invalidStream = fs.createReadStream(path.resolve(__dirname, "../src/data/non_existent.csv"));
  let errorCaught = false;

  const dummySink = new Writable({
    write(chunk, enc, cb) { cb(); }
  });

  try {
    await pipelineAsync(invalidStream, dummySink);
  } catch (err) {
    errorCaught = true;
    assert(err.code === "ENOENT", `Pipeline caught expected error code ENOENT for missing file: ${err.code}`);
  }

  assert(errorCaught, "Pipeline successfully captured and bubbled stream error without crashing");
  assert(invalidStream.destroyed, "Invalid readable stream was properly cleaned up and destroyed");

  console.log("=================================================");
  console.log(` Stream Tests Completed: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("=================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
