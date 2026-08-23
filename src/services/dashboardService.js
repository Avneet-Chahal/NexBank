/**
 * NexBank – Dashboard Financial & Transaction Service
 */

// Fallback dataset for offline / error resilience
const FALLBACK_DASHBOARD_DATA = {
  transactions: [
    { id: "TX-901", title: "Amazon", category: "Shopping", type: "expense", amount: 2499, date: "2026-08-19", status: "Completed" },
    { id: "TX-902", title: "Salary Credit", category: "Income", type: "income", amount: 52000, date: "2026-08-18", status: "Completed" },
    { id: "TX-903", title: "Electricity Bill", category: "Utilities", type: "expense", amount: 1850, date: "2026-08-17", status: "Completed" },
    { id: "TX-904", title: "Netflix Subscription", category: "Entertainment", type: "expense", amount: 649, date: "2026-08-16", status: "Completed" },
    { id: "TX-905", title: "Food Delivery", category: "Food", type: "expense", amount: 520, date: "2026-08-15", status: "Completed" },
    { id: "TX-906", title: "Freelance Payout", category: "Income", type: "income", amount: 15000, date: "2026-08-14", status: "Completed" },
    { id: "TX-907", title: "Grocery Supermarket", category: "Groceries", type: "expense", amount: 3200, date: "2026-08-12", status: "Completed" },
    { id: "TX-908", title: "Fiber Internet", category: "Utilities", type: "expense", amount: 999, date: "2026-08-10", status: "Completed" }
  ],
  recentActivities: [
    { id: "ACT-1", text: "Account registration completed & provisioned", timestamp: "Today, 09:30 AM", status: "success" },
    { id: "ACT-2", text: "NexShield™ 256-bit encryption verified", timestamp: "Yesterday, 04:15 PM", status: "success" },
    { id: "ACT-3", text: "Last security session verified from current device", timestamp: "Aug 18, 08:20 PM", status: "info" },
    { id: "ACT-4", text: "Monthly digital bank statement generated", timestamp: "Aug 15, 11:00 AM", status: "info" }
  ]
};

/**
 * Fetches dashboard financial data using Fetch API

 * @returns {Promise<{ transactions: Array<object>, recentActivities: Array<object> }>}
 */
export async function fetchDashboardData() {
  // Controlled simulated network latency to display polished loading state
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    // Fetch API call
    const response = await fetch("/data/dashboardData.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Fetch API failed, utilizing secure fallback data:", error);
    // Graceful offline fallback
    return FALLBACK_DASHBOARD_DATA;
  }
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

  // reduce() for computing total income
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((accumulator, currentTx) => accumulator + Number(currentTx.amount), 0);

  // reduce() for computing total expenses
  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((accumulator, currentTx) => accumulator + Number(currentTx.amount), 0);

  // Dynamic calculations 
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const availableBalance = baseBalance;

  // Percentage Calculations for Visual Statistics
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

/**
 * Filters and sorts transactions without mutating the source array
 * 
 * @param {Array<object>} transactions - Source transaction list
 * @param {string} searchQuery - Search query string
 * @param {'all' | 'income' | 'expense'} typeFilter - Type filter
 * @param {'newest' | 'oldest' | 'highest' | 'lowest'} sortBy - Sort option
 * @returns {Array<object>} Filtered and sorted transactions
 */
export function filterAndSortTransactions(
  transactions = [],
  searchQuery = "",
  typeFilter = "all",
  sortBy = "newest"
) {
  if (!Array.isArray(transactions)) return [];

  const query = searchQuery.trim().toLowerCase();

  // Step 1: Filter transactions by Search Query & Type
  const filtered = transactions.filter((tx) => {
    // Matches title or category
    const matchesSearch =
      query === "" ||
      tx.title.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query);

    // Matches transaction type
    const matchesType =
      typeFilter === "all" ||
      tx.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  // Step 2: Non-mutating Sort using Spread Operator
  const sorted = [...filtered].sort((a, b) => {
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

  return sorted;
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
