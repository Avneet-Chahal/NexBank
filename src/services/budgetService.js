/**
 * @file budgetService.js
 * @description Enterprise budget management service for NexBank.
 * 
 * Architecture & Data Flow:
 * - Primary Layer: Express REST API (/api/budgets) authenticated via JWT Bearer tokens.
 * - Resilience Layer: LocalStorage fallback for offline demonstration and testing.
 * - Computation Layer: Real-time ledger reconciliation correlating monthly budgets with transaction records.
 */

import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const LOCAL_BUDGETS_KEY = "nexbank_local_budgets";

/** Default currency standard across NexBank budget operations */
export const DEFAULT_BUDGET_CURRENCY = "INR";

/** Warning alert threshold percentage for budget consumption */
export const BUDGET_WARNING_THRESHOLD_PERCENT = 80;

/** Exceeded alert threshold percentage for budget consumption */
export const BUDGET_EXCEEDED_THRESHOLD_PERCENT = 100;

/**
 * @typedef {Object} BudgetRecord
 * @property {string} id - Unique budget identifier (e.g. BDG-101 or MongoDB ObjectId)
 * @property {string} category - Budget category (e.g. Shopping, Utilities)
 * @property {number} amount - Budget allocation amount
 * @property {string} month - Calendar month in YYYY-MM format
 * @property {string} [currency='INR'] - Currency code
 */

/**
 * @typedef {Object} BudgetStatusResult
 * @property {number} spent - Aggregate spent amount within the budget period
 * @property {number} remaining - Net remaining budget allowance
 * @property {number} percentage - Rounded consumption percentage (0-100+)
 * @property {boolean} isWarning - True if consumption is between 80% and 99%
 * @property {boolean} isExceeded - True if consumption has reached or exceeded 100%
 * @property {'normal'|'warning'|'danger'} status - Semantic status token for visual badges
 */

/**
 * Formats a YYYY-MM string into a localized human-readable display string
 * 
 * @param {string} yearMonth - Month string in "YYYY-MM" format
 * @returns {string} Formatted label (e.g. "August 2026")
 */
export function formatBudgetMonth(yearMonth) {
  if (!yearMonth || typeof yearMonth !== "string" || !yearMonth.includes("-")) {
    return yearMonth || "";
  }
  const [year, month] = yearMonth.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  return isNaN(dateObj.getTime())
    ? yearMonth
    : dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Seed data for offline demo fallback
const INITIAL_DEMO_BUDGETS = [
  { id: "BDG-101", category: "Shopping", amount: 5000, month: "2026-08", currency: "INR" },
  { id: "BDG-102", category: "Groceries", amount: 6000, month: "2026-08", currency: "INR" },
  { id: "BDG-103", category: "Utilities", amount: 4000, month: "2026-08", currency: "INR" },
  { id: "BDG-104", category: "Entertainment", amount: 1500, month: "2026-08", currency: "INR" },
  { id: "BDG-105", category: "Food", amount: 2500, month: "2026-08", currency: "INR" }
];

function getLocalBudgets() {
  const saved = getStorageItem(LOCAL_BUDGETS_KEY);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  setStorageItem(LOCAL_BUDGETS_KEY, INITIAL_DEMO_BUDGETS);
  return INITIAL_DEMO_BUDGETS;
}

function saveLocalBudgets(budgets) {
  setStorageItem(LOCAL_BUDGETS_KEY, budgets);
}

/**
 * Fetch monthly budgets from Express backend or offline fallback
 * 
 * @param {string} [month] - Month string (YYYY-MM)
 * @returns {Promise<{ budgets: Array<object>, source: string }>}
 */
export async function fetchBudgets(month) {
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = month ? `http://localhost:5000/api/budgets?month=${month}` : "http://localhost:5000/api/budgets";
    const response = await fetch(url, { headers });

    if (response.ok) {
      const result = await response.json();
      return {
        budgets: result.data || [],
        source: result.source || "Express Backend"
      };
    }
  } catch (err) {
    console.warn("Backend budgets API unreachable, using local fallback:", err.message);
  }

  // Fallback to local storage
  const allLocal = getLocalBudgets();
  const filtered = month ? allLocal.filter((b) => b.month === month) : allLocal;
  return {
    budgets: filtered,
    source: "Resilient Demo Storage (Offline)"
  };
}

/**
 * Create or upsert a category budget
 */
export async function createOrUpdateBudget({ category, amount, month }) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:5000/api/budgets", {
      method: "POST",
      headers,
      body: JSON.stringify({ category, amount, month })
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (err) {
    console.warn("Backend offline, updating local budget store:", err.message);
  }

  // Local fallback
  const local = getLocalBudgets();
  const existingIdx = local.findIndex(
    (b) => b.category.toLowerCase() === category.toLowerCase() && b.month === month
  );

  let updatedRecord;
  if (existingIdx !== -1) {
    local[existingIdx].amount = Number(amount);
    updatedRecord = local[existingIdx];
  } else {
    updatedRecord = {
      id: `BDG-${Date.now().toString().slice(-4)}`,
      category: category.trim(),
      amount: Number(amount),
      month: month || new Date().toISOString().slice(0, 7),
      currency: "INR"
    };
    local.push(updatedRecord);
  }

  saveLocalBudgets(local);
  return updatedRecord;
}

/**
 * Delete a budget
 */
export async function deleteBudget(id) {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:5000/api/budgets/${id}`, {
      method: "DELETE",
      headers
    });

    if (response.ok) return true;
  } catch (err) {
    console.warn("Backend offline, deleting from local budget store:", err.message);
  }

  // Local fallback
  const local = getLocalBudgets();
  const filtered = local.filter((b) => b.id !== id && b._id !== id);
  saveLocalBudgets(filtered);
  return true;
}

/**
 * Calculates budget spending, remaining, percentage, and warning status
 * based on actual transactions records!
 * 
 * @param {object} budget 
 * @param {Array<object>} transactions 
 * @returns {{
 *   spent: number,
 *   remaining: number,
 *   percentage: number,
 *   isWarning: boolean,
 *   isExceeded: boolean,
 *   status: 'normal' | 'warning' | 'danger'
 * }}
 */
export function calculateBudgetStatus(budget, transactions = []) {
  if (!budget || !budget.amount) {
    return { spent: 0, remaining: 0, percentage: 0, isWarning: false, isExceeded: false, status: "normal" };
  }

  const budgetMonth = budget.month;
  const categoryName = budget.category.toLowerCase();

  // Find all expenses in this category matching the budget month
  const spent = transactions
    .filter((tx) => {
      if (tx.type !== "expense") return false;
      if (!tx.category || tx.category.toLowerCase() !== categoryName) return false;
      if (budgetMonth && tx.date) {
        const dateStr = typeof tx.date === "string" ? tx.date : new Date(tx.date).toISOString();
        return dateStr.startsWith(budgetMonth);
      }
      return true;
    })
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const budgetAmount = Number(budget.amount);
  const remaining = budgetAmount - spent;
  const percentage = Math.round((spent / budgetAmount) * 100);

  const isExceeded = percentage >= BUDGET_EXCEEDED_THRESHOLD_PERCENT;
  const isWarning = percentage >= BUDGET_WARNING_THRESHOLD_PERCENT && !isExceeded;

  let status = "normal";
  if (isExceeded) status = "danger";
  else if (isWarning) status = "warning";

  return {
    spent,
    remaining,
    percentage,
    isWarning,
    isExceeded,
    status
  };
}
