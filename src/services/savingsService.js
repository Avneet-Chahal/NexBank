import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const LOCAL_GOALS_KEY = "nexbank_local_savings_goals";

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
 * @returns {Promise<{ goals: Array<object>, source: string }>}
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
 * Create a new savings goal
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
 * Edit a savings goal
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
 * Process contribution towards a goal
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
 * Delete a goal
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

