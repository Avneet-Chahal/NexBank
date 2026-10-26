/**
 * Live HTTP REST API Integration Test against running Express server (http://localhost:5000)
 */

import assert from "assert";

async function runLiveIntegrationTest() {
  console.log("=================================================");
  console.log(" Running Live HTTP Integration Test (Port 5000)");
  console.log("=================================================");

  const BASE_URL = "http://localhost:5000";

  // 1. Authenticate with demo customer
  console.log("\n[1] Authenticating with demo@nexbank.com...");
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@nexbank.com", password: "Demo@123" })
  });

  assert.strictEqual(authRes.status, 200, `Login should return 200, got ${authRes.status}`);
  const authData = await authRes.json();
  assert.ok(authData.token, "Auth response contains JWT token");
  const token = authData.token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
  console.log(" [PASS] Successfully authenticated. User:", authData.data?.name);

  // 2. Test Feature 1: Add spent to budget category via live API
  console.log("\n[2] Testing Feature 1: Live Add Spent to Category Budget...");
  const spentPayload = {
    title: "Fresh Groceries Live Test",
    category: "Groceries",
    amount: 750,
    type: "expense",
    date: "2026-08-15",
    description: "Weekly fresh vegetables and dairy",
    paymentMethod: "Debit Card"
  };

  const spentRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(spentPayload)
  });
  assert.strictEqual(spentRes.status, 201, `Create spending transaction should return 201, got ${spentRes.status}`);
  const spentData = await spentRes.json();
  assert.ok(spentData.data?._id, "Transaction created and returned MongoDB _id");
  console.log(` [PASS] Spending transaction recorded successfully: ${spentData.data?.transactionId} (ID: ${spentData.data?._id})`);

  // Verify persistence by fetching transactions
  const txsRes = await fetch(`${BASE_URL}/api/transactions`, { headers: authHeaders });
  const txsData = await txsRes.json();
  const foundTx = txsData.data?.find((t) => t._id === spentData.data._id || t.transactionId === spentData.data.transactionId);
  assert.ok(foundTx, "Spending transaction successfully persisted and retrieved from live API");
  assert.strictEqual(foundTx.amount, 750, "Persisted spending amount is 750");
  console.log(" [PASS] Spending transaction persistence verified in MongoDB Atlas.");

  // 3. Test Feature 2: 10-Day Savings Goal Reminder via live API
  console.log("\n[3] Testing Feature 2: Live Goal 10-Day Reminder Trigger...");
  // Create a goal with target date in 10 days
  const targetDate10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const goalPayload = {
    name: `Live Test Goal ${Date.now().toString().slice(-4)}`,
    targetAmount: 25000,
    savedAmount: 5000,
    targetDate: targetDate10Days,
    category: "General"
  };

  const goalRes = await fetch(`${BASE_URL}/api/goals`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(goalPayload)
  });
  assert.strictEqual(goalRes.status, 201, `Create goal should return 201, got ${goalRes.status}`);
  const createdGoal = (await goalRes.json()).data;
  console.log(` [PASS] Test savings goal created: '${createdGoal.name}' with target date ${targetDate10Days}`);

  // Trigger reminder scan
  const reminderScanRes = await fetch(`${BASE_URL}/api/goals/check-reminders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({})
  });
  assert.strictEqual(reminderScanRes.status, 200, "Reminder check returned 200");
  const scanData = await reminderScanRes.json();
  console.log(" [PASS] Reminder scan executed:", scanData.data);

  // Check notifications
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders });
  const notifData = await notifRes.json();
  const goalNotif = notifData.data?.find((n) =>
    n.type === "goal_reminder" &&
    n.message?.includes(`Only 10 days left to complete your savings goal '${createdGoal.name}'`)
  );
  assert.ok(goalNotif, "Live in-app reminder notification found in notifications list");
  console.log(` [PASS] Notification found: "${goalNotif.title}" - "${goalNotif.message}"`);

  // 4. Test Feature 4: Live Support Ticket Submission & Notification
  console.log("\n[4] Testing Feature 4: Live Support Ticket & Notification Creation...");
  const ticketPayload = {
    category: "Card Dispute",
    subject: `Live POS Dispute ${Date.now().toString().slice(-4)}`,
    description: "Transaction was charged twice at fuel station.",
    priority: "Normal"
  };

  const ticketRes = await fetch(`${BASE_URL}/api/tickets`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(ticketPayload)
  });
  assert.strictEqual(ticketRes.status, 201, `Create ticket should return 201, got ${ticketRes.status}`);
  const ticketData = (await ticketRes.json()).data;
  assert.ok(ticketData.ticketId, "Ticket created with ID: " + ticketData.ticketId);
  console.log(` [PASS] Support ticket created successfully: ${ticketData.ticketId}`);

  // Verify that Notification for ticket was automatically created in MongoDB Atlas
  const notifRes2 = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders });
  const notifData2 = await notifRes2.json();
  const ticketNotif = notifData2.data?.find((n) =>
    n.title === "Support Ticket Submitted" &&
    n.message?.includes(ticketPayload.subject)
  );
  assert.ok(ticketNotif, "Support ticket confirmation notification found in live notifications");
  console.log(` [PASS] Live Ticket notification confirmed: "${ticketNotif.title}" - "${ticketNotif.message}"`);

  // Clean up created spending transaction & test goal
  await fetch(`${BASE_URL}/api/transactions/${spentData.data._id}`, { method: "DELETE", headers: authHeaders });
  await fetch(`${BASE_URL}/api/goals/${createdGoal._id || createdGoal.id}`, { method: "DELETE", headers: authHeaders });

  console.log("\n=================================================");
  console.log(" ALL LIVE REST API ENDPOINTS VERIFIED SUCCESSFULLY!");
  console.log("=================================================\n");
}

runLiveIntegrationTest().catch((err) => {
  console.error("\n❌ Live integration test failed:", err);
  process.exit(1);
});
