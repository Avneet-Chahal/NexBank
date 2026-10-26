/**
 * @file savingsService.js
 * @description Enterprise savings goal management service for NexBank.
 * 
 * Architecture & Data Flow:
 * - Primary Layer: Express REST API (/api/goals) backed by MongoDB Atlas.
 * - Resilience Layer: LocalStorage fallback for offline demonstration and resilience.
 * - Milestones & Alerts: 10-day milestone deadline notifications and goal celebration events.
 */

import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const LOCAL_GOALS_KEY = "nexbank_local_savings_goals";

/** Default currency standard for savings goals */
export const DEFAULT_SAVINGS_CURRENCY = "INR";

/** Milestone window in days for automated deadline reminders */
export const SAVINGS_REMINDER_WINDOW_DAYS = 10;

/**
 * @typedef {Object} SavingsGoal
 * @property {string} id - Unique goal ID or MongoDB ObjectId
 * @property {string} name - Name/title of the savings target
 * @property {number} targetAmount - Target monetary amount in INR
 * @property {number} savedAmount - Cumulative saved amount
 * @property {string} targetDate - Target completion deadline (YYYY-MM-DD)
 * @property {string} category - Category (e.g. Emergency, Gadgets, Education)
 * @property {boolean} isCompleted - True if savedAmount >= targetAmount
 * @property {string} [currency='INR'] - Currency code
 */

/**
 * @typedef {Object} SavingsGoalProgress
 * @property {number} percentage - Rounded progress percentage (0 - 100)
 * @property {number} remainingAmount - Amount remaining until target is achieved
 * @property {boolean} isTargetMet - True if target is reached or surpassed
 */

/**
 * Computes progress percentage and remaining balance for a savings target
 * 
 * @param {number} savedAmount - Current saved funds
 * @param {number} targetAmount - Target monetary threshold
 * @returns {SavingsGoalProgress} Computed progress metrics
 */
export function calculateGoalProgress(savedAmount, targetAmount) {
  const saved = Math.max(0, Number(savedAmount) || 0);
  const target = Math.max(0, Number(targetAmount) || 0);
  if (target === 0) {
    return { percentage: 100, remainingAmount: 0, isTargetMet: true };
  }
  const percentage = Math.min(100, Math.round((saved / target) * 100));
  const remainingAmount = Math.max(0, target - saved);
  return {
    percentage,
    remainingAmount,
    isTargetMet: saved >= target
  };
}

/**
 * Formats a goal deadline into localized readable string
 * 
 * @param {string|Date} targetDate - Date string or instance
 * @returns {string} Localized date string (e.g. "Dec 31, 2026")
 */
export function formatGoalDeadline(targetDate) {
  if (!targetDate) return "No deadline set";
  const dateObj = new Date(targetDate);
  return isNaN(dateObj.getTime())
    ? String(targetDate)
    : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Seed data for offline demo fallback
const INITIAL_DEMO_GOALS = [
  {
    id: "GOAL-201",
    name: "Emergency Reserve Fund",
    targetAmount: 100000,
    savedAmount: 65000,
    targetDate: "2026-12-31",
    category: "Emergency",
    isCompleted: false,
    currency: "INR"
  },
  {
    id: "GOAL-202",
    name: "MacBook Pro M-Series",
    targetAmount: 150000,
    savedAmount: 112500,
    targetDate: "2026-10-15",
    category: "Gadgets",
    isCompleted: false,
    currency: "INR"
  },
  {
    id: "GOAL-203",
    name: "Cloud Architect Certification",
    targetAmount: 35000,
    savedAmount: 35000,
    targetDate: "2026-08-30",
    category: "Education",
    isCompleted: true,
    currency: "INR"
  }
];

function getLocalGoals() {
  const saved = getStorageItem(LOCAL_GOALS_KEY);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  setStorageItem(LOCAL_GOALS_KEY, INITIAL_DEMO_GOALS);
  return INITIAL_DEMO_GOALS;
}

function saveLocalGoals(goals) {
  setStorageItem(LOCAL_GOALS_KEY, goals);
}

/**
 * Fetch savings goals from Express backend or offline fallback
 * 
 * @returns {Promise<{ goals: Array<SavingsGoal>, source: string }>} Resolves with list of goals and data source
 */
export async function fetchGoals() {
  const token = getAuthToken();

  try {
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:5000/api/goals", { headers });
    if (response.ok) {
      const result = await response.json();
      return {
        goals: result.data || [],
        source: result.source || (token ? "MongoDB Atlas" : "Express Backend")
      };
    }
  } catch (err) {
    console.warn("Backend goals API unreachable, using local fallback:", err.message);
  }

  return {
    goals: getLocalGoals(),
    source: "Resilient Demo Storage (Offline)"
  };
}

/**
 * Create a new savings goal via backend REST API
 * 
 * @param {object} goalData
 * @param {string} goalData.name - Title of the savings goal
 * @param {number|string} goalData.targetAmount - Target savings balance
 * @param {number|string} [goalData.savedAmount=0] - Initial saved balance
 * @param {string} goalData.targetDate - Target completion deadline
 * @param {string} [goalData.category='General'] - Savings category
 * @returns {Promise<SavingsGoal>} Created savings goal record
 * @throws {Error} When user is unauthenticated or validation fails
 */
export async function createGoal(goalData) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication session expired or not found. Please sign in to create savings goals.");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };

  const response = await fetch("http://localhost:5000/api/goals", {
    method: "POST",
    headers,
    body: JSON.stringify(goalData)
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.error?.message ||
      `Failed to create savings goal (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return resJson.data;
}

/**
 * Edit an existing savings goal
 * 
 * @param {string} id - Goal ID or MongoDB ObjectId
 * @param {Partial<SavingsGoal>} updates - Fields to modify
 * @returns {Promise<SavingsGoal>} Updated goal record
 * @throws {Error} When user is unauthenticated or operation fails
 */
export async function updateGoal(id, updates) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication session expired or not found. Please sign in to update goals.");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };

  const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updates)
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.error?.message ||
      `Failed to update savings goal (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return resJson.data;
}

/**
 * Process monetary contribution towards a goal
 * 
 * @param {string} id - Goal ID or MongoDB ObjectId
 * @param {number|string} amount - Monetary contribution delta to credit
 * @returns {Promise<SavingsGoal>} Updated goal record with new balance
 * @throws {Error} When user is unauthenticated or operation fails
 */
export async function contributeToGoal(id, amount) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication session expired or not found. Please sign in to contribute to goals.");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };

  const response = await fetch(`http://localhost:5000/api/goals/${id}/contribute`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount })
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.error?.message ||
      `Contribution failed (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return resJson.data;
}

/**
 * Delete a goal by its identifier
 * 
 * @param {string} id - Goal ID or MongoDB ObjectId
 * @returns {Promise<boolean>} True upon successful deletion
 * @throws {Error} When user is unauthenticated or deletion fails
 */
export async function deleteGoal(id) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication session expired or not found. Please sign in to delete goals.");
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };

  const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
    method: "DELETE",
    headers
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      resJson.error?.message ||
      `Failed to delete goal (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return true;
}

