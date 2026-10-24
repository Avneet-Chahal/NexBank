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
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:5000/api/goals", { headers });
    if (response.ok) {
      const result = await response.json();
      return {
        goals: result.data || [],
        source: result.source || "Express Backend"
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
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("http://localhost:5000/api/goals", {
      method: "POST",
      headers,
      body: JSON.stringify(goalData)
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (err) {
    console.warn("Backend offline, saving to local goals store:", err.message);
  }

  // Local fallback
  const local = getLocalGoals();
  const newGoal = {
    id: `GOAL-${Date.now().toString().slice(-4)}`,
    name: goalData.name.trim(),
    targetAmount: Number(goalData.targetAmount),
    savedAmount: Number(goalData.savedAmount || 0),
    targetDate: goalData.targetDate,
    category: goalData.category || "General",
    isCompleted: Number(goalData.savedAmount || 0) >= Number(goalData.targetAmount),
    currency: "INR"
  };

  local.push(newGoal);
  saveLocalGoals(local);
  return newGoal;
}

/**
 * Edit a savings goal
 */
export async function updateGoal(id, updates) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (err) {
    console.warn("Backend offline, updating local goals store:", err.message);
  }

  // Local fallback
  const local = getLocalGoals();
  const idx = local.findIndex((g) => g.id === id || g._id === id);
  if (idx !== -1) {
    Object.assign(local[idx], updates);
    if (updates.savedAmount !== undefined || updates.targetAmount !== undefined) {
      local[idx].isCompleted = local[idx].savedAmount >= local[idx].targetAmount;
    }
    saveLocalGoals(local);
    return local[idx];
  }
  return null;
}

/**
 * Process simulated demo contribution towards a goal
 * (Clearly marked as academic portfolio simulation)
 */
export async function contributeToGoal(id, amount) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:5000/api/goals/${id}/contribute`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount })
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (err) {
    console.warn("Backend offline, updating simulated local goal contribution:", err.message);
  }

  // Local fallback
  const local = getLocalGoals();
  const idx = local.findIndex((g) => g.id === id || g._id === id);
  if (idx !== -1) {
    const updatedAmount = Math.max(0, local[idx].savedAmount + Number(amount));
    local[idx].savedAmount = updatedAmount;
    local[idx].isCompleted = updatedAmount >= local[idx].targetAmount;
    saveLocalGoals(local);
    return local[idx];
  }
  return null;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id) {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:5000/api/goals/${id}`, {
      method: "DELETE",
      headers
    });

    if (response.ok) return true;
  } catch (err) {
    console.warn("Backend offline, deleting from local goals store:", err.message);
  }

  // Local fallback
  const local = getLocalGoals();
  const filtered = local.filter((g) => g.id !== id && g._id !== id);
  saveLocalGoals(filtered);
  return true;
}
