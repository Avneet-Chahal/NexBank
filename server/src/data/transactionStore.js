/**
 * NexBank – Transaction Development Data Store
 * 
 * In-memory persistence store for development & CA-2 demonstration.
 * Operations perform genuine mutations against this dataset during the server lifecycle.
 * Prevents arbitrary balance adjustments and cross-user transaction mutations.
 */

// Initial seed dataset aligned with NexBank customer records
const INITIAL_TRANSACTIONS = [
  {
    id: "TX-901",
    userId: "NX-8801",
    title: "Amazon",
    category: "Shopping",
    type: "expense",
    amount: 2499.0,
    date: "2026-08-19",
    status: "Completed",
    createdAt: "2026-08-19T10:00:00.000Z"
  },
  {
    id: "TX-902",
    userId: "NX-8801",
    title: "Salary Credit",
    category: "Income",
    type: "income",
    amount: 52000.0,
    date: "2026-08-18",
    status: "Completed",
    createdAt: "2026-08-18T09:00:00.000Z"
  },
  {
    id: "TX-903",
    userId: "NX-8801",
    title: "Electricity Bill",
    category: "Utilities",
    type: "expense",
    amount: 1850.0,
    date: "2026-08-17",
    status: "Completed",
    createdAt: "2026-08-17T14:30:00.000Z"
  },
  {
    id: "TX-904",
    userId: "NX-8801",
    title: "Netflix Subscription",
    category: "Entertainment",
    type: "expense",
    amount: 649.0,
    date: "2026-08-16",
    status: "Completed",
    createdAt: "2026-08-16T18:15:00.000Z"
  },
  {
    id: "TX-905",
    userId: "NX-8801",
    title: "Food Delivery",
    category: "Food",
    type: "expense",
    amount: 520.0,
    date: "2026-08-15",
    status: "Completed",
    createdAt: "2026-08-15T20:00:00.000Z"
  },
  {
    id: "TX-906",
    userId: "NX-8801",
    title: "Freelance Payout",
    category: "Income",
    type: "income",
    amount: 15000.0,
    date: "2026-08-14",
    status: "Completed",
    createdAt: "2026-08-14T11:45:00.000Z"
  },
  {
    id: "TX-907",
    userId: "NX-8801",
    title: "Grocery Supermarket",
    category: "Groceries",
    type: "expense",
    amount: 3200.0,
    date: "2026-08-12",
    status: "Completed",
    createdAt: "2026-08-12T16:20:00.000Z"
  },
  {
    id: "TX-908",
    userId: "NX-8801",
    title: "Fiber Internet",
    category: "Utilities",
    type: "expense",
    amount: 999.0,
    date: "2026-08-10",
    status: "Completed",
    createdAt: "2026-08-10T12:00:00.000Z"
  }
];

// Active in-memory transaction records collection
let transactions = [...INITIAL_TRANSACTIONS];

/**
 * Retrieves all transactions with optional filtering and sorting
 * 
 * @param {object} [filters]
 * @param {string} [filters.type] - "income" | "expense" | "all"
 * @param {string} [filters.search] - Search query matching title or category
 * @param {string} [filters.sortBy] - "newest" | "oldest" | "highest" | "lowest"
 * @param {string} [filters.userId="NX-8801"] - User scope
 * @returns {Array<object>} Filtered and sorted transactions
 */
export function getAllTransactions(filters = {}) {
  const { type = "all", search = "", sortBy = "newest", userId = "NX-8801" } = filters;
  const query = search.trim().toLowerCase();

  // 1. Filter by owner and criteria
  let result = transactions.filter((tx) => {
    // Only return records belonging to the requesting user scope
    const matchesUser = !userId || tx.userId === userId;

    const matchesType =
      type === "all" || tx.type.toLowerCase() === type.toLowerCase();

    const matchesSearch =
      query === "" ||
      tx.title.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query);

    return matchesUser && matchesType && matchesSearch;
  });

  // 2. Sort results
  result = [...result].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === "highest") {
      return b.amount - a.amount;
    }
    if (sortBy === "lowest") {
      return a.amount - b.amount;
    }
    return 0;
  });

  return result;
}

/**
 * Finds a single transaction by ID
 * 
 * @param {string} id - Transaction ID
 * @param {string} [userId="NX-8801"] - Enforce owner authorization
 * @returns {object|null}
 */
export function getTransactionById(id, userId = "NX-8801") {
  const normalizedId = String(id).trim().toUpperCase();
  const tx = transactions.find((t) => t.id.toUpperCase() === normalizedId);

  if (!tx) return null;

  // Verify ownership
  if (userId && tx.userId !== userId) {
    const error = new Error("Access Denied: You do not have permission to view another user's transaction.");
    error.statusCode = 403;
    throw error;
  }

  return tx;
}

/**
 * Creates a new transaction record
 * 
 * @param {object} payload - Validated input data
 * @param {string} payload.title
 * @param {string} payload.category
 * @param {'income'|'expense'} payload.type
 * @param {number} payload.amount
 * @param {string} [payload.date]
 * @param {string} [userId="NX-8801"]
 * @returns {object} Created transaction record
 */
export function createTransaction(payload, userId = "NX-8801") {
  const now = new Date();
  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
  const newId = `TX-${uniqueSuffix}`;

  const newRecord = {
    id: newId,
    userId: userId || "NX-8801",
    title: payload.title.trim(),
    category: payload.category.trim(),
    type: payload.type.toLowerCase(),
    amount: Number(Number(payload.amount).toFixed(2)),
    date: payload.date || now.toISOString().slice(0, 10),
    status: "Completed",
    createdAt: now.toISOString()
  };

  // Prepend new record to genuine in-memory array
  transactions.unshift(newRecord);
  return newRecord;
}

/**
 * Updates an existing transaction record
 * 
 * @param {string} id - Transaction ID
 * @param {object} updates - Fields to update
 * @param {string} [userId="NX-8801"] - Enforce owner authorization
 * @returns {object} Updated transaction record
 */
export function updateTransaction(id, updates, userId = "NX-8801") {
  const normalizedId = String(id).trim().toUpperCase();
  const index = transactions.findIndex((t) => t.id.toUpperCase() === normalizedId);

  if (index === -1) {
    return null;
  }

  const existingTx = transactions[index];

  // Prevent modifying another user's transaction
  if (userId && existingTx.userId !== userId) {
    const error = new Error("Access Denied: You do not have permission to modify another user's transaction.");
    error.statusCode = 403;
    throw error;
  }

  // Prevent altering immutable identifiers or core account balance attributes
  const { id: forbiddenId, userId: forbiddenUserId, balance, accountBalance, ...allowedUpdates } = updates;

  // Process allowed updates
  const updatedRecord = {
    ...existingTx,
    ...(allowedUpdates.title !== undefined && { title: allowedUpdates.title.trim() }),
    ...(allowedUpdates.category !== undefined && { category: allowedUpdates.category.trim() }),
    ...(allowedUpdates.type !== undefined && { type: allowedUpdates.type.toLowerCase() }),
    ...(allowedUpdates.amount !== undefined && { amount: Number(Number(allowedUpdates.amount).toFixed(2)) }),
    ...(allowedUpdates.status !== undefined && { status: allowedUpdates.status.trim() }),
    updatedAt: new Date().toISOString()
  };

  transactions[index] = updatedRecord;
  return updatedRecord;
}

/**
 * Deletes a transaction record
 * 
 * @param {string} id - Transaction ID
 * @param {string} [userId="NX-8801"] - Enforce owner authorization
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteTransaction(id, userId = "NX-8801") {
  const normalizedId = String(id).trim().toUpperCase();
  const index = transactions.findIndex((t) => t.id.toUpperCase() === normalizedId);

  if (index === -1) {
    return false;
  }

  const existingTx = transactions[index];

  // Prevent deleting another user's transaction
  if (userId && existingTx.userId !== userId) {
    const error = new Error("Access Denied: You do not have permission to delete another user's transaction.");
    error.statusCode = 403;
    throw error;
  }

  transactions.splice(index, 1);
  return true;
}

/**
 * Resets the in-memory dataset to default seed records (useful for testing)
 */
export function resetTransactionStore() {
  transactions = [...INITIAL_TRANSACTIONS];
}
