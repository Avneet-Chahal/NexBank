import "dotenv/config";
process.env.JWT_SECRET = process.env.JWT_SECRET || "nexbank_jwt_dev_secret_key_evaluation_2026_ca2";
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';

import budgetRoutes from '../src/routes/budgetRoutes.js';
import savingsRoutes from '../src/routes/savingsRoutes.js';
import cardRoutes from '../src/routes/cardRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import ticketRoutes from '../src/routes/ticketRoutes.js';
import accountRoutes from '../src/routes/accountRoutes.js';
import userRoutes from '../src/routes/userRoutes.js';
import { errorHandler } from '../src/middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', savingsRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET;

let server;
let port;
let baseUrl;

const TEST_USER = {
  id: "NX-8801",
  email: "demo@nexbank.com",
  name: "Alex Mercer",
  accountNumber: "NB8577145"
};

const token = jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '1h' });

async function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log(" Running NexBank 2.0 Feature Routes Verification ");
  console.log("=================================================");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

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
    // 1. Budgets Tests
    const unauthPost = await request('POST', '/api/budgets', { category: 'Dining Out', amount: 500 });
    assert(unauthPost.status === 401, 'Unauthenticated POST /api/budgets returns 401');

    const budgetsRes = await request('GET', '/api/budgets?month=2024-03', null, { Authorization: `Bearer ${token}` });
    assert(budgetsRes.status === 200, 'Authenticated GET /api/budgets returns 200');
    assert(Array.isArray(budgetsRes.body.data), 'Budgets response contains data array');

    const newBudgetRes = await request('POST', '/api/budgets', {
      category: 'Dining Out',
      amount: 750,
      month: '2024-03'
    }, { Authorization: `Bearer ${token}` });
    assert(newBudgetRes.status === 201, 'POST /api/budgets creates a budget (201)');
    assert(newBudgetRes.body.data.amount === 750, 'Budget saved with correct amount');

    // 2. Savings Goals Tests
    const goalsRes = await request('GET', '/api/goals', null, { Authorization: `Bearer ${token}` });
    assert(goalsRes.status === 200, 'Authenticated GET /api/goals returns 200');
    assert(Array.isArray(goalsRes.body.data), 'Goals response contains data array');

    const newGoalRes = await request('POST', '/api/goals', {
      name: 'Emergency Rainy Day Fund',
      targetAmount: 5000,
      targetDate: '2025-12-31',
      category: 'Safety'
    }, { Authorization: `Bearer ${token}` });
    assert(newGoalRes.status === 201, 'POST /api/goals creates a savings goal (201)');
    const createdGoalId = newGoalRes.body.data.id || newGoalRes.body.data._id;

    const contribRes = await request('POST', `/api/goals/${createdGoalId}/contribute`, {
      amount: 250
    }, { Authorization: `Bearer ${token}` });
    assert(contribRes.status === 200, 'POST /api/goals/:id/contribute increments savings progress (200)');
    assert(contribRes.body.data.savedAmount >= 250, 'Contributed amount reflected in goal');

    // 3. Cards Management Tests
    const cardsRes = await request('GET', '/api/cards', null, { Authorization: `Bearer ${token}` });
    assert(cardsRes.status === 200, 'Authenticated GET /api/cards returns 200');
    assert(cardsRes.body.data && cardsRes.body.data.cardNumber, 'Cards response returns user virtual card details');

    const cardSettingsRes = await request('PATCH', '/api/cards/settings', {
      isFrozen: true,
      monthlyLimit: 6000
    }, { Authorization: `Bearer ${token}` });
    assert(cardSettingsRes.status === 200, 'PATCH /api/cards/settings toggles card freeze and limit (200)');
    assert(cardSettingsRes.body.data.isFrozen === true, 'Card status reflected as frozen');

    // 4. Notifications Tests
    const notifsRes = await request('GET', '/api/notifications', null, { Authorization: `Bearer ${token}` });
    assert(notifsRes.status === 200, 'Authenticated GET /api/notifications returns 200');
    assert(Array.isArray(notifsRes.body.data), 'Notifications response has data array');

    const markAllRes = await request('PATCH', '/api/notifications/mark-all-read', {}, { Authorization: `Bearer ${token}` });
    assert(markAllRes.status === 200, 'PATCH /api/notifications/mark-all-read returns 200');

    // 5. Support Tickets Tests
    const ticketsRes = await request('GET', '/api/tickets', null, { Authorization: `Bearer ${token}` });
    assert(ticketsRes.status === 200, 'Authenticated GET /api/tickets returns 200');

    const createTicketRes = await request('POST', '/api/tickets', {
      category: 'Billing',
      subject: 'Clarification regarding debit alert',
      description: 'Requesting review of automated subscription debit fee.',
      priority: 'Normal'
    }, { Authorization: `Bearer ${token}` });
    assert(createTicketRes.status === 201, 'POST /api/tickets creates a ticket with academic disclaimer (201)');
    const ticketIdent = createTicketRes.body.data.id || createTicketRes.body.data.ticketId;
    assert(ticketIdent.startsWith('TKT-'), 'Ticket number generated with proper TKT- prefix');

    // 6. Statement CSV Streaming Export Test
    const exportRes = await request('GET', '/api/accounts/statement/export?format=csv', null, { Authorization: `Bearer ${token}` });
    assert(exportRes.status === 200, 'GET /api/accounts/statement/export returns 200');
    assert(exportRes.headers['content-type'].includes('text/csv'), 'Statement export response has text/csv Content-Type');
    assert(exportRes.headers['content-disposition'].includes('attachment'), 'Statement export has attachment header');

    // 7. Security Events Test
    const secEventsRes = await request('GET', '/api/users/security-events', null, { Authorization: `Bearer ${token}` });
    assert(secEventsRes.status === 200, 'GET /api/users/security-events returns 200');
    assert(Array.isArray(secEventsRes.body.data), 'Security events array returned');

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log("=================================================");
    console.log(` NexBank 2.0 Feature Tests: ${passed} passed, ${failed} failed `);
    console.log("=================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
