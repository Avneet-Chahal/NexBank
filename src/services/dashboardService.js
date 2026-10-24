import { getStorageItem, setStorageItem } from "../utils/storage.js";
import { getAuthToken } from "./authService.js";

// Storage key for non-sensitive transaction explorer UI preferences
const TX_FILTER_STORAGE_KEY = "nexbank_tx_filter_preferences";

/**
 * Retrieves saved transaction filter and sort preferences from localStorage
 * Fallbacks to sensible defaults if none exist.
 * 
 * @returns {{ typeFilter: string, categoryFilter: string, sortBy: string }}
 */
export function getSavedFilterPreferences() {
  const defaults = { typeFilter: "all", categoryFilter: "all", sortBy: "newest" };
  const saved = getStorageItem(TX_FILTER_STORAGE_KEY);

  if (saved && typeof saved === "object") {
    const validTypes = ["all", "income", "expense"];
    const validSorts = ["newest", "oldest", "highest", "lowest"];

    return {
      typeFilter: validTypes.includes(saved.typeFilter) ? saved.typeFilter : defaults.typeFilter,
      categoryFilter: typeof saved.categoryFilter === "string" ? saved.categoryFilter : defaults.categoryFilter,
      sortBy: validSorts.includes(saved.sortBy) ? saved.sortBy : defaults.sortBy
    };
  }

  return defaults;
}

/**
 * Persists only non-sensitive transaction filter & sort preferences to localStorage
 * 
 * @param {object} preferences
 * @returns {boolean}
 */
export function saveFilterPreferences(preferences) {
  if (!preferences || typeof preferences !== "object") return false;

  const validTypes = ["all", "income", "expense"];
  const validSorts = ["newest", "oldest", "highest", "lowest"];

  const safePayload = {
    typeFilter: validTypes.includes(preferences.typeFilter) ? preferences.typeFilter : "all",
    categoryFilter: typeof preferences.categoryFilter === "string" ? preferences.categoryFilter : "all",
    sortBy: validSorts.includes(preferences.sortBy) ? preferences.sortBy : "newest"
  };

  return setStorageItem(TX_FILTER_STORAGE_KEY, safePayload);
}

/**
 * Fetches dashboard financial data using Fetch API with robust error handling & JSON validation
 * 
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - Optional abort signal
 * @returns {Promise<{ transactions: Array<object>, recentActivities: Array<object>, source: string }>}
 */
export async function fetchDashboardData(options = {}) {
  const { signal } = options;

  // 1. Attempt to fetch live transactions from Express Backend REST API
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("http://localhost:5000/api/transactions", {
      method: "GET",
      headers,
      signal
    });

    if (response.ok) {
      const apiResult = await response.json();
      if (apiResult && Array.isArray(apiResult.data)) {
        return {
          transactions: apiResult.data,
          source: apiResult.source || "Express Backend (In-Memory)",
          recentActivities: [
            { id: "ACT-1", text: "Live transactions synchronized with Express backend", timestamp: "Just now", status: "success" },
            { id: "ACT-2", text: "NexShield™ 256-bit encryption verified", timestamp: "Today, 09:30 AM", status: "success" },
            { id: "ACT-3", text: "Last security session verified from current device", timestamp: "Today, 08:20 AM", status: "info" },
            { id: "ACT-4", text: "Monthly digital bank statement generated", timestamp: "Aug 15, 11:00 AM", status: "info" }
          ]
        };
      }
    }
  } catch (backendError) {
    if (backendError.name === "AbortError") throw backendError;
    console.warn("Backend API unreachable, using local JSON fallback:", backendError.message);
  }

  // 2. Controlled simulated network latency to display polished loading state
  await new Promise((resolve) => setTimeout(resolve, 300));

  // REST API call using native Fetch API (fallback)
  const response = await fetch("/data/dashboardData.json", {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load financial records from banking API (HTTP ${response.status}: ${response.statusText || "Server Error"})`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error("Invalid response format: Failed to parse JSON financial records.");
  }

  if (!data || typeof data !== "object" || !Array.isArray(data.transactions)) {
    throw new Error("Malformed JSON: Expected banking transactions array in API response.");
  }

  return {
    transactions: data.transactions,
    source: "Resilient Demo Fallback (Offline / Dev)",
    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : []
  };
}

/**
 * Calculates real-time financial metrics using reduce()
 * 
 * @param {Array<object>} transactions - List of transactions
 * @param {number} [baseBalance=84250.75] - User base balance
 * @returns {{
 *   totalIncome: number,
 *   totalExpenses: number,
 *   netSavings: number,
 *   availableBalance: number,
 *   expensePercentage: number,
 *   savingsPercentage: number
 * }}
 */
export function calculateFinancialMetrics(transactions = [], baseBalance = 84250.75) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      availableBalance: baseBalance,
      expensePercentage: 0,
      savingsPercentage: 0
    };
  }

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const availableBalance = baseBalance;

  const totalFlow = totalIncome > 0 ? totalIncome : totalExpenses;
  const expensePercentage = totalFlow > 0 ? Math.min(100, Math.round((totalExpenses / totalFlow) * 100)) : 0;
  const savingsPercentage = totalFlow > 0 ? Math.max(0, 100 - expensePercentage) : 0;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    availableBalance,
    expensePercentage,
    savingsPercentage
  };
}

// Curated modern color palette for category charts
const CATEGORY_COLORS = [
  "#0052FF", // Primary Blue
  "#8B5CF6", // Violet
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6"  // Teal
];

/**
 * Calculates category-wise expense breakdown with percentages and color codes
 * 
 * @param {Array<object>} transactions 
 * @returns {Array<{ category: string, total: number, count: number, percentage: number, color: string }>}
 */
export function calculateCategoryBreakdown(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const expenseTx = transactions.filter((tx) => tx.type === "expense");
  const totalExpense = expenseTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  if (totalExpense === 0) return [];

  const map = {};
  for (const tx of expenseTx) {
    const cat = tx.category || "Uncategorized";
    if (!map[cat]) {
      map[cat] = { category: cat, total: 0, count: 0 };
    }
    map[cat].total += Number(tx.amount || 0);
    map[cat].count += 1;
  }

  const result = Object.values(map)
    .map((item, idx) => ({
      ...item,
      percentage: Math.round((item.total / totalExpense) * 100),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
    }))
    .sort((a, b) => b.total - a.total);

  return result;
}

/**
 * Calculates monthly spending and income aggregates, plus month-over-month comparisons
 * 
 * @param {Array<object>} transactions 
 * @returns {{
 *   monthlyData: Array<{ monthLabel: string, monthKey: string, income: number, expense: number, net: number }>,
 *   momComparison: {
 *     hasComparison: boolean,
 *     currentMonth: string,
 *     previousMonth: string,
 *     expenseChangePercent: number,
 *     incomeChangePercent: number,
 *     savingsChangePercent: number,
 *     increasedSpending: boolean
 *   }
 * }}
 */
export function calculateMonthlyTrends(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      monthlyData: [],
      momComparison: {
        hasComparison: false,
        currentMonth: "",
        previousMonth: "",
        expenseChangePercent: 0,
        incomeChangePercent: 0,
        savingsChangePercent: 0,
        increasedSpending: false
      }
    };
  }

  const monthlyGroups = {};

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const dateObj = new Date(tx.date);
    if (isNaN(dateObj.getTime())) return;

    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        monthKey,
        monthLabel,
        income: 0,
        expense: 0,
        net: 0
      };
    }

    const amt = Number(tx.amount || 0);
    if (tx.type === "income") {
      monthlyGroups[monthKey].income += amt;
    } else if (tx.type === "expense") {
      monthlyGroups[monthKey].expense += amt;
    }
  });

  // Calculate net for each month
  Object.values(monthlyGroups).forEach((g) => {
    g.net = Math.max(0, g.income - g.expense);
  });

  // Sort chronologically
  const sortedMonths = Object.values(monthlyGroups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Determine Month-over-Month comparison
  let momComparison = {
    hasComparison: false,
    currentMonth: "",
    previousMonth: "",
    expenseChangePercent: 0,
    incomeChangePercent: 0,
    savingsChangePercent: 0,
    increasedSpending: false
  };

  if (sortedMonths.length >= 2) {
    const cur = sortedMonths[sortedMonths.length - 1];
    const prev = sortedMonths[sortedMonths.length - 2];

    const expChange = prev.expense > 0
      ? Math.round(((cur.expense - prev.expense) / prev.expense) * 100)
      : cur.expense > 0 ? 100 : 0;

    const incChange = prev.income > 0
      ? Math.round(((cur.income - prev.income) / prev.income) * 100)
      : cur.income > 0 ? 100 : 0;

    const savChange = prev.net > 0
      ? Math.round(((cur.net - prev.net) / prev.net) * 100)
      : cur.net > 0 ? 100 : 0;

    momComparison = {
      hasComparison: true,
      currentMonth: cur.monthLabel,
      previousMonth: prev.monthLabel,
      expenseChangePercent: expChange,
      incomeChangePercent: incChange,
      savingsChangePercent: savChange,
      increasedSpending: expChange > 0
    };
  } else if (sortedMonths.length === 1) {
    const cur = sortedMonths[0];
    momComparison = {
      hasComparison: false,
      currentMonth: cur.monthLabel,
      previousMonth: "N/A",
      expenseChangePercent: 0,
      incomeChangePercent: 0,
      savingsChangePercent: 0,
      increasedSpending: false
    };
  }

  return {
    monthlyData: sortedMonths,
    momComparison
  };
}

/**
 * Filters and sorts transactions with support for text search, type, category, date range, and sort order
 * 
 * @param {Array<object>} transactions - Source transaction list
 * @param {object} filters
 * @param {string} [filters.searchQuery=""]
 * @param {'all' | 'income' | 'expense'} [filters.typeFilter="all"]
 * @param {string} [filters.categoryFilter="all"]
 * @param {string} [filters.startDate=""]
 * @param {string} [filters.endDate=""]
 * @param {'newest' | 'oldest' | 'highest' | 'lowest'} [filters.sortBy="newest"]
 * @returns {Array<object>} Filtered and sorted transactions
 */
export function filterAndSortTransactions(
  transactions = [],
  filters = {}
) {
  if (!Array.isArray(transactions)) return [];

  // Support both object form or legacy 4-parameter call
  let searchQuery = "";
  let typeFilter = "all";
  let categoryFilter = "all";
  let startDate = "";
  let endDate = "";
  let sortBy = "newest";

  if (typeof filters === "string" || arguments.length > 2) {
    searchQuery = arguments[1] || "";
    typeFilter = arguments[2] || "all";
    sortBy = arguments[3] || "newest";
  } else if (typeof filters === "object") {
    searchQuery = filters.searchQuery || "";
    typeFilter = filters.typeFilter || "all";
    categoryFilter = filters.categoryFilter || "all";
    startDate = filters.startDate || "";
    endDate = filters.endDate || "";
    sortBy = filters.sortBy || "newest";
  }

  const query = searchQuery.trim().toLowerCase();
  const startTs = startDate ? new Date(startDate).getTime() : null;
  const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

  const filtered = transactions.filter((tx) => {
    // 1. Text Search matches title or category or status
    const matchesSearch =
      query === "" ||
      (tx.title && tx.title.toLowerCase().includes(query)) ||
      (tx.category && tx.category.toLowerCase().includes(query)) ||
      (tx.status && tx.status.toLowerCase().includes(query));

    // 2. Matches transaction type
    const matchesType =
      typeFilter === "all" ||
      (tx.type && tx.type.toLowerCase() === typeFilter.toLowerCase());

    // 3. Matches category
    const matchesCategory =
      categoryFilter === "all" ||
      (tx.category && tx.category.toLowerCase() === categoryFilter.toLowerCase());

    // 4. Matches date range
    let matchesDate = true;
    if (tx.date && (startTs || endTs)) {
      const txTime = new Date(tx.date).getTime();
      if (startTs && txTime < startTs) matchesDate = false;
      if (endTs && txTime > endTs) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  // Non-mutating Sort using Spread Operator
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === "highest") {
      return Number(b.amount || 0) - Number(a.amount || 0);
    }
    if (sortBy === "lowest") {
      return Number(a.amount || 0) - Number(b.amount || 0);
    }
    return 0;
  });

  return sorted;
}

/**
 * Extracts unique categories from transactions list
 * 
 * @param {Array<object>} transactions 
 * @returns {Array<string>}
 */
export function getAvailableCategories(transactions = []) {
  if (!Array.isArray(transactions)) return [];
  const set = new Set();
  transactions.forEach((tx) => {
    if (tx.category) set.add(tx.category);
  });
  return Array.from(set).sort();
}

/**
 * Formats a number into Indian Rupee currency format (e.g. ₹ 84,250.75)
 * 
 * @param {number} amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(num);
}

