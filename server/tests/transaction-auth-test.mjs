import "dotenv/config";
process.env.JWT_SECRET = process.env.JWT_SECRET || "nexbank_jwt_dev_secret_key_evaluation_2026_ca2";
import jwt from "jsonwebtoken";
import express from "express";
import { requireAuth } from "../src/middleware/authMiddleware.js";
import transactionRoutes from "../src/routes/transactionRoutes.js";
import { errorHandler } from "../src/middleware/errorMiddleware.js";
import { resetTransactionStore } from "../src/data/transactionStore.js";
import { createUser } from "../src/data/userStore.js";

// Setup mock Express app mounting transactionRoutes
const app = express();
app.use(express.json());
app.use("/api/transactions", transactionRoutes);
app.use(errorHandler);

const TEST_SECRET = process.env.JWT_SECRET;

// Token for Owner of TX-901 (NX-8801)
const tokenUserA = jwt.sign({ id: "NX-8801", email: "demo@nexbank.com" }, TEST_SECRET, { expiresIn: "1h" });

async function runTests() {
  // Provision User B in store so token is valid
  const userB = await createUser({
    fullName: "Other Customer",
    email: "other@nexbank.com",
    password: "Password@123",
    mobile: "9123456789"
  });
  const tokenUserB = jwt.sign({ id: userB.id, email: userB.email }, TEST_SECRET, { expiresIn: "1h" });
  const server = app.listen(0); // Ephemeral port
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/transactions`;

  console.log(`[TEST] Testing Transaction Write Security on ephemeral port ${port}...`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` PASS: ${message}`);
      passed++;
    } else {
      console.error(` FAIL: ${message}`);
      failed++;
    }
  }

  try {
    resetTransactionStore();

    // 1. Unauthenticated POST -> 401
    const resPostNoAuth = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Coffee", category: "Food", type: "expense", amount: 150 })
    });
    assert(resPostNoAuth.status === 401, "Unauthenticated POST /api/transactions returns 401");

    // 2. Unauthenticated PATCH -> 401
    const resPatchNoAuth = await fetch(`${baseUrl}/TX-901`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Coffee Updated" })
    });
    assert(resPatchNoAuth.status === 401, "Unauthenticated PATCH /api/transactions/TX-901 returns 401");

    // 3. Unauthenticated DELETE -> 401
    const resDeleteNoAuth = await fetch(`${baseUrl}/TX-901`, {
      method: "DELETE"
    });
    assert(resDeleteNoAuth.status === 401, "Unauthenticated DELETE /api/transactions/TX-901 returns 401");

    // 4. Authenticated POST by User A -> 201
    const resPostAuth = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenUserA}`
      },
      body: JSON.stringify({ title: "Test Investment", category: "Investment", type: "expense", amount: 5000 })
    });
    const postData = await resPostAuth.json();
    assert(resPostAuth.status === 201 && postData.success === true, "Authenticated POST /api/transactions creates transaction (201)");
    const createdId = postData.data?.id;

    // 5. Authenticated PATCH own transaction (User A modifying created transaction) -> 200
    const resPatchOwn = await fetch(`${baseUrl}/${createdId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenUserA}`
      },
      body: JSON.stringify({ title: "Test Investment Revised" })
    });
    const patchData = await resPatchOwn.json();
    assert(resPatchOwn.status === 200 && patchData.data?.title === "Test Investment Revised", "Authenticated PATCH on own transaction returns 200");

    // 6. Authenticated PATCH another user's transaction (User B modifying User A's transaction) -> 403
    const resPatchOther = await fetch(`${baseUrl}/${createdId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenUserB}`
      },
      body: JSON.stringify({ title: "Hacked Title" })
    });
    assert(resPatchOther.status === 403, "Authenticated PATCH on another user's transaction returns 403 Access Denied");

    // 7. Authenticated DELETE another user's transaction (User B deleting User A's transaction) -> 403
    const resDeleteOther = await fetch(`${baseUrl}/${createdId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tokenUserB}`
      }
    });
    assert(resDeleteOther.status === 403, "Authenticated DELETE on another user's transaction returns 403 Access Denied");

    // 8. Authenticated DELETE own transaction (User A deleting User A's transaction) -> 200
    const resDeleteOwn = await fetch(`${baseUrl}/${createdId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tokenUserA}`
      }
    });
    assert(resDeleteOwn.status === 200, "Authenticated DELETE on own transaction returns 200 OK");

    // 9. Invalid Transaction ID format -> 400
    const resInvalidId = await fetch(`${baseUrl}/invalid-id-format`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tokenUserA}`
      }
    });
    assert(resInvalidId.status === 400, "Malformed transaction ID parameter returns 400 Validation Error");

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\n--- Transaction Write Security Summary ---`);
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
