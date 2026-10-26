const BASE_URL = 'http://localhost:5000/api';

async function testDemoUserFlow() {
  console.log('====================================================');
  console.log(' Testing Demo Customer Real MongoDB End-to-End Flow ');
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
    // 1. Sign in with demo customer
    console.log('--- Step 1: Sign in with demo@nexbank.com ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@nexbank.com', password: 'Demo@123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Demo login returns HTTP 200 OK');
    assert(Boolean(loginData.token), 'Demo login returned valid JWT token');
    const token = loginData.token;
    const demoUserId = loginData.user.id || loginData.user._id;
    console.log(` [INFO] Demo User ID in MongoDB: ${demoUserId}`);

    // 2. Add an expense
    console.log('\n--- Step 2: Record an expense to MongoDB Atlas ---');
    const expensePayload = {
      title: 'Quarterly Team Lunch',
      amount: 2850.50,
      category: 'Food & Dining',
      type: 'expense',
      date: '2026-10-26',
      paymentMethod: 'Debit Card',
      description: 'Engineering team sprint celebration'
    };
    const createTxRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(expensePayload)
    });
    const createTxData = await createTxRes.json();
    assert(createTxRes.status === 201, 'POST /api/transactions returns 201 Created');
    assert(createTxData.source === 'MongoDB Atlas', 'Transaction source is MongoDB Atlas');
    assert(createTxData.data.title === expensePayload.title, 'Created transaction title matches');
    assert(createTxData.data.amount === expensePayload.amount, 'Created transaction amount matches');
    assert(createTxData.data.paymentMethod === 'Debit Card', 'Payment method persisted');
    const createdTxId = createTxData.data.id || createTxData.data._id;

    // 3. Fetch transactions list and verify persistence
    console.log('\n--- Step 3: Fetch transactions from MongoDB Atlas ---');
    const getTxRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getTxData = await getTxRes.json();
    assert(getTxRes.status === 200, 'GET /api/transactions returns 200 OK');
    assert(getTxData.source === 'MongoDB Atlas', 'GET transactions source is MongoDB Atlas');
    const foundTx = getTxData.data.find(t => (t.id === createdTxId || t._id === createdTxId));
    assert(Boolean(foundTx), 'Created expense is found in returned MongoDB transactions list');

    // 4. Create a savings goal
    console.log('\n--- Step 4: Create a savings goal in MongoDB Atlas ---');
    const goalPayload = {
      name: 'Tokyo Autumn Vacation',
      targetAmount: 150000,
      targetDate: '2026-11-20',
      category: 'Travel'
    };
    const createGoalRes = await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(goalPayload)
    });
    const createGoalData = await createGoalRes.json();
    assert(createGoalRes.status === 201, 'POST /api/goals returns 201 Created');
    assert(createGoalData.data.name === goalPayload.name, 'Created goal name matches');
    assert(createGoalData.source === 'MongoDB Atlas', 'Goal saved to MongoDB Atlas');
    const createdGoalId = createGoalData.data.id || createGoalData.data._id;

    // 5. Verify automatic in-app notification created for goal
    console.log('\n--- Step 5: Verify automatic goal notification in MongoDB Atlas ---');
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, 'GET /api/notifications returns 200 OK');
    assert(notifData.source === 'MongoDB Atlas', 'Notifications source is MongoDB Atlas');
    const goalNotif = notifData.data.find(n => n.message && n.message.includes('Tokyo Autumn Vacation'));
    assert(Boolean(goalNotif), 'Automatic notification generated with goal name and target');
    assert(goalNotif.type === 'goal_reminder', 'Notification has type goal_reminder');
    assert(goalNotif.isRead === false, 'Notification begins with isRead: false');
    console.log(` [INFO] Generated In-App Notification: "${goalNotif.message}"`);

    // 6. Test contributing to goal
    console.log('\n--- Step 6: Contribute to savings goal in MongoDB Atlas ---');
    const contributeRes = await fetch(`${BASE_URL}/goals/${createdGoalId}/contribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 50000 })
    });
    const contributeData = await contributeRes.json();
    assert(contributeRes.status === 200, 'Contribute returns 200 OK');
    assert(contributeData.data.savedAmount === 50000, 'Goal savedAmount updated to 50000');

    // 7. Test mark notification as read
    console.log('\n--- Step 7: Mark notification as read in MongoDB Atlas ---');
    const notifId = goalNotif.id || goalNotif._id;
    const markReadRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returns 200 OK');
    assert(markReadData.data.isRead === true, 'Notification isRead updated to true in MongoDB');

    // 8. Clean up created transaction and goal
    console.log('\n--- Step 8: Clean up demo transaction and goal ---');
    const deleteTxRes = await fetch(`${BASE_URL}/transactions/${createdTxId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(deleteTxRes.status === 200, 'DELETE /api/transactions/:id returns 200 OK');

    const deleteGoalRes = await fetch(`${BASE_URL}/goals/${createdGoalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(deleteGoalRes.status === 200, 'DELETE /api/goals/:id returns 200 OK');

    console.log('\n====================================================');
    console.log(` Demo Flow Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Error running demo user test:', err);
    process.exit(1);
  }
}

testDemoUserFlow();
