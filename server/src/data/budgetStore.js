/**
 * NexBank – In-Memory Budget Store (Fallback for Offline/Dev Mode)
 */

let budgets = [
  {
    id: "BDG-101",
    userId: "NX-8801",
    category: "Shopping",
    amount: 5000,
    month: "2026-08",
    currency: "INR",
    createdAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "BDG-102",
    userId: "NX-8801",
    category: "Groceries",
    amount: 6000,
    month: "2026-08",
    currency: "INR",
    createdAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "BDG-103",
    userId: "NX-8801",
    category: "Utilities",
    amount: 4000,
    month: "2026-08",
    currency: "INR",
    createdAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "BDG-104",
    userId: "NX-8801",
    category: "Entertainment",
    amount: 1500,
    month: "2026-08",
    currency: "INR",
    createdAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "BDG-105",
    userId: "NX-8801",
    category: "Food",
    amount: 2500,
    month: "2026-08",
    currency: "INR",
    createdAt: "2026-08-01T00:00:00.000Z"
  }
];

export function getUserBudgets(userId, month) {
  return budgets.filter((b) => {
    const matchesUser = b.userId === userId;
    const matchesMonth = month ? b.month === month : true;
    return matchesUser && matchesMonth;
  });
}

export function createBudget({ category, amount, month, currency = "INR" }, userId) {
  // Check for duplicate in same month
  const existing = budgets.find(
    (b) => b.userId === userId && b.category.toLowerCase() === category.toLowerCase() && b.month === month
  );
  if (existing) {
    existing.amount = Number(amount);
    return existing;
  }

  const newBudget = {
    id: `BDG-${Date.now().toString().slice(-4)}`,
    userId,
    category: category.trim(),
    amount: Number(amount),
    month: month.trim(),
    currency,
    createdAt: new Date().toISOString()
  };

  budgets.push(newBudget);
  return newBudget;
}

export function updateBudget(id, updates, userId) {
  const index = budgets.findIndex((b) => b.id === id && b.userId === userId);
  if (index === -1) return null;

  if (updates.amount !== undefined) {
    budgets[index].amount = Number(updates.amount);
  }
  if (updates.category !== undefined) {
    budgets[index].category = updates.category.trim();
  }
  if (updates.month !== undefined) {
    budgets[index].month = updates.month.trim();
  }

  return budgets[index];
}

export function deleteBudget(id, userId) {
  const index = budgets.findIndex((b) => b.id === id && b.userId === userId);
  if (index === -1) return false;

  budgets.splice(index, 1);
  return true;
}

export function resetBudgetStore() {
  budgets = [];
}
