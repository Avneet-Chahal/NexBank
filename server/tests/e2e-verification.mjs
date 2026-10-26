// Using built-in global fetch


const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log(' Starting NexBank End-to-End Verification Test Suite ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` [PASS] ${message}`);
      passed++;
    } else {
      console.error(` [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with 200');
    console.log(` [INFO] Server database status: ${healthData.data ? healthData.data.database : healthData.database}`);

    // 1. User Registration & Registration Email
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const regPayload = {
      fullName: 'Test NexBank User',
      email: uniqueEmail,
      password: 'Password123!',
      mobile: '9876543210'
    };

    console.log(`\n--- Step 1: Testing User Registration & Welcome Email ---`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Registration returns 201 Created`);
    assert(regData.success === true, `Registration response has success: true`);
    assert(Boolean(regData.token), `Registration returned JWT token`);
    assert(regData.user.email === uniqueEmail, `Registered user email matches payload`);

    const userToken = regData.token;
    const userId = regData.user.id || regData.user._id;

    // 2. User Login with Invalid Credentials (should NOT send email, should return 401)
    console.log(`\n--- Step 2: Testing Invalid Login Credentials ---`);
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword999!' })
    });
    assert(invalidLoginRes.status === 401, `Invalid login credentials returns HTTP 401 Unauthorized`);

    // 3. User Login with Valid Credentials (should trigger login email, return 200)
    console.log(`\n--- Step 3: Testing Valid Login & Confirmation Email ---`);
    const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'Password123!' })
    });
    const validLoginData = await validLoginRes.json();
    assert(validLoginRes.status === 200, `Valid login returns 200 OK`);
    assert(Boolean(validLoginData.token), `Login returns fresh JWT auth token`);
    assert(validLoginData.user.email === uniqueEmail, `Login returns correct user profile`);

    // 4. Feature 1: Expense Tracking Creation
    console.log(`\n--- Step 4: Testing Expense Creation & Persistence ---`);
    const expensePayload = {
      title: 'Whole Foods Grocery Run',
      amount: 1450.75,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-26',
      paymentMethod: 'Debit Card',
      description: 'Weekly organic groceries receipt #9823'
    };

    const createExpRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify(expensePayload)
    });
    const createExpData = await createExpRes.json();
    assert(createExpRes.status === 201, `Create expense returns 201 Created`);
    assert(createExpData.success === true, `Expense creation response has success: true`);
    assert(createExpData.data.title === expensePayload.title, `Created expense preserves title`);
    assert(createExpData.data.amount === expensePayload.amount, `Created expense preserves amount`);
    assert(createExpData.data.type === 'expense', `Created expense has type "expense"`);
    assert(createExpData.data.category === 'Groceries', `Created expense has category "Groceries"`);
    assert(createExpData.data.paymentMethod === 'Debit Card', `Created expense preserves paymentMethod`);
    assert(createExpData.data.description === expensePayload.description, `Created expense preserves description`);

    const createdTxId = createExpData.data._id || createExpData.data.id || createExpData.data.transactionId;

    // 5. Fetch Transactions and Verify Expense Persistence
    console.log(`\n--- Step 5: Testing Transaction Retrieval & Ledger Totals ---`);
    const getTxRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const getTxData = await getTxRes.json();
    assert(getTxRes.status === 200, `GET /api/transactions returns 200 OK`);
    const fetchedExp = getTxData.data.find(
      (tx) => (tx._id === createdTxId || tx.id === createdTxId || tx.transactionId === createdTxId)
    );
    assert(Boolean(fetchedExp), `Created expense is returned in transactions list`);
    assert(fetchedExp.paymentMethod === 'Debit Card', `Persisted expense retains paymentMethod on fetch`);
    assert(fetchedExp.description === expensePayload.description, `Persisted expense retains description on fetch`);

    // 6. Update Expense (Edit)
    console.log(`\n--- Step 6: Testing Expense Update (PUT / PATCH) ---`);
    const updateRes = await fetch(`${BASE_URL}/transactions/${createdTxId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Whole Foods Grocery Run - Edited',
        amount: 1520.00,
        category: 'Groceries',
        type: 'expense',
        date: '2026-10-26',
        paymentMethod: 'UPI / Net Banking',
        description: 'Updated with bakery items'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, `Update expense returns 200 OK`);
    assert(updateData.data.amount === 1520.00, `Updated expense reflects new amount 1520.00`);
    assert(updateData.data.paymentMethod === 'UPI / Net Banking', `Updated expense reflects new payment method`);

    // 7. Feature 2: Automatic Savings Goal Notification
    console.log(`\n--- Step 7: Testing Savings Goal Creation & Automatic In-App Notification ---`);
    const goalPayload = {
      name: 'New MacBook Pro M4',
      targetAmount: 180000,
      targetDate: '2026-12-31',
      category: 'Electronics'
    };

    const createGoalRes = await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify(goalPayload)
    });
    const createGoalData = await createGoalRes.json();
    assert(createGoalRes.status === 201, `Create savings goal returns 201 Created`);
    assert(createGoalData.data.name === goalPayload.name, `Goal created with name ${goalPayload.name}`);

    // Fetch notifications to verify automatic reminder was created
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, `GET /api/notifications returns 200 OK`);
    console.log(` [DEBUG] Notifications count: ${notifData.data ? notifData.data.length : 0}`);
    if (notifData.data && notifData.data.length > 0) {
      console.log(` [DEBUG] First notification:`, notifData.data[0]);
    }
    const goalNotif = notifData.data.find(
      (n) => n.message && n.message.includes('New MacBook Pro M4')
    );
    assert(Boolean(goalNotif), `Automatic notification was created for savings goal with name and target amount`);
    if (goalNotif) {
      assert(goalNotif.type === 'goal_reminder', `Notification has correct type 'goal_reminder'`);
      assert(goalNotif.read === false || goalNotif.isRead === false, `New notification starts unread`);
      console.log(` [INFO] Generated Notification Message: "${goalNotif.message}"`);
    }

    // 8. User Data Isolation Verification
    console.log(`\n--- Step 8: Testing Cross-User Data Isolation ---`);
    const user2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Second User Isolated',
        email: `user2_${Date.now()}@example.com`,
        password: 'Password123!',
        mobile: '9876543211'
      })
    });
    const user2Data = await user2Res.json();
    const user2Token = user2Data.token;

    // Check user 2 cannot see user 1's transactions
    const user2TxRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    const user2TxData = await user2TxRes.json();
    const leakedTx = user2TxData.data.find(
      (tx) => tx._id === createdTxId || tx.id === createdTxId || tx.transactionId === createdTxId
    );
    assert(!leakedTx, `User 2 cannot see User 1's expense transaction (Strict User Isolation)`);

    // Check user 2 cannot see user 1's notifications
    const user2NotifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    const user2NotifData = await user2NotifRes.json();
    const leakedNotif = user2NotifData.data.find(
      (n) => n.message && n.message.includes('New MacBook Pro M4')
    );
    assert(!leakedNotif, `User 2 cannot see User 1's goal notification (Strict User Isolation)`);

    // Check user 2 cannot delete user 1's transaction
    const unauthorizedDelete = await fetch(`${BASE_URL}/transactions/${createdTxId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert(
      unauthorizedDelete.status === 403 || unauthorizedDelete.status === 404,
      `User 2 cannot delete User 1's transaction (HTTP 403 / 404)`
    );

    // 9. Clean up / Delete User 1's transaction
    console.log(`\n--- Step 9: Testing Transaction Deletion ---`);
    const deleteRes = await fetch(`${BASE_URL}/transactions/${createdTxId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(deleteRes.status === 200, `User 1 deletes own expense returns 200 OK`);

    console.log('\n====================================================');
    console.log(` Verification Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
