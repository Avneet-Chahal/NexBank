import React, { useState, useEffect, useMemo } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import {
  fetchDashboardData,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  calculateFinancialMetrics,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  filterAndSortTransactions,
  getAvailableCategories,
  formatCurrency,
  getSavedFilterPreferences,
  saveFilterPreferences
} from "../../services/dashboardService";
import DataSourceBadge from "./components/DataSourceBadge";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import CategoryBreakdownChart from "./components/CategoryBreakdownChart";
import MonthOverMonthCard from "./components/MonthOverMonthCard";
import "./Dashboard.css";

/**
 * NexBank – Customer Dashboard Component
 * 
 * @param {object} props
 * @param {object} props.user - Authenticated customer record
 * @param {function} props.onNavigate - Page navigation callback
 * @param {function} props.onLogout - Logout action callback
 */
export function DashboardPage({ user, onNavigate, onLogout }) {
  // State for asynchronous data loading
  const [data, setData] = useState({ transactions: [], recentActivities: [], source: "Local Demo Fallback" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feature 1: Expense Tracking Modal & Feedback State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Shopping",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "Debit Card",
    description: ""
  });
  const [expenseModalError, setExpenseModalError] = useState("");
  const [expenseToast, setExpenseToast] = useState("");
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);

  // Initialize non-sensitive filter & sort preferences from Local Storage
  const [initialPrefs] = useState(() => getSavedFilterPreferences());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialPrefs.typeFilter);
  const [categoryFilter, setCategoryFilter] = useState(initialPrefs.categoryFilter || "all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState(initialPrefs.sortBy);

  // Load Dashboard Data asynchronously on component mount
  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  // Persist non-sensitive filter & sort UI preferences to Local Storage whenever they change
  useEffect(() => {
    saveFilterPreferences({ typeFilter, categoryFilter, sortBy });
  }, [typeFilter, categoryFilter, sortBy]);

  /**
   * Asynchronous function to fetch and populate dashboard data
   * Handles loading, error, and success states safely
   */
  const loadData = async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const abortSignal = signal instanceof AbortSignal ? signal : undefined;
      const responseData = await fetchDashboardData({ signal: abortSignal });
      setData(responseData);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Controlled form submission handler for transaction filtering
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();
  };

  /**
   * Reset filter form to default state and synchronize with Local Storage
   */
  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setSortBy("newest");
    saveFilterPreferences({ typeFilter: "all", categoryFilter: "all", sortBy: "newest" });
  };

  /**
   * Open modal to record a new expense
   */
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: "",
      amount: "",
      category: "Shopping",
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "Debit Card",
      description: ""
    });
    setExpenseModalError("");
    setIsExpenseModalOpen(true);
  };

  /**
   * Open modal to edit an existing transaction
   */
  const handleOpenEditExpense = (tx) => {
    setEditingExpense(tx);
    const dateFormatted = tx.date
      ? new Date(tx.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setExpenseForm({
      title: tx.title || "",
      amount: String(tx.amount || ""),
      category: tx.category || "Shopping",
      type: tx.type || "expense",
      date: dateFormatted,
      paymentMethod: tx.paymentMethod || "Debit Card",
      description: tx.description || ""
    });
    setExpenseModalError("");
    setIsExpenseModalOpen(true);
  };

  /**
   * Handle Expense creation or update submission
   */
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (isExpenseSubmitting) return;

    if (!expenseForm.title || !expenseForm.title.trim()) {
      setExpenseModalError("Transaction title / payee is required.");
      return;
    }
    if (expenseForm.title.trim().length < 2) {
      setExpenseModalError("Title must be at least 2 characters.");
      return;
    }
    const amt = Number(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseModalError("Please enter a valid positive transaction amount greater than 0.");
      return;
    }
    if (!expenseForm.date) {
      setExpenseModalError("Transaction date is required.");
      return;
    }

    setIsExpenseSubmitting(true);
    setExpenseModalError("");

    try {
      if (editingExpense) {
        const txId = editingExpense._id || editingExpense.id || editingExpense.transactionId;
        await updateTransaction(txId, {
          title: expenseForm.title.trim(),
          amount: amt,
          category: expenseForm.category,
          type: expenseForm.type,
          date: expenseForm.date,
          paymentMethod: expenseForm.paymentMethod,
          description: expenseForm.description.trim()
        });
        setExpenseToast("Transaction updated successfully!");
      } else {
        await createTransaction({
          title: expenseForm.title.trim(),
          amount: amt,
          category: expenseForm.category,
          type: expenseForm.type,
          date: expenseForm.date,
          paymentMethod: expenseForm.paymentMethod,
          description: expenseForm.description.trim()
        });
        setExpenseToast(
          expenseForm.type === "expense"
            ? "Expense recorded successfully and saved to ledger!"
            : "Income recorded successfully and saved to ledger!"
        );
      }

      setIsExpenseModalOpen(false);
      await loadData();
      setTimeout(() => setExpenseToast(""), 4500);
    } catch (err) {
      setExpenseModalError(err.message || "Failed to save transaction.");
    } finally {
      setIsExpenseSubmitting(false);
    }
  };

  /**
   * Handle deleting a transaction
   */
  const handleDeleteExpense = async (tx, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete transaction "${tx.title}"?`);
    if (!confirmed) return;

    try {
      const txId = tx._id || tx.id || tx.transactionId;
      await deleteTransaction(txId);
      setExpenseToast("Transaction deleted successfully.");
      await loadData();
      setTimeout(() => setExpenseToast(""), 4500);
    } catch (err) {
      alert("Failed to delete transaction: " + err.message);
    }
  };

  /**
   * Format transaction date display nicely
   */
  const formatTxDate = (dateVal) => {
    if (!dateVal) return "Recent";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Compute Greeting based on current local hour
  const currentHour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (currentHour >= 17) {
    timeGreeting = "Good Evening";
  }

  // Fallback / Logged-in Customer Information
  const {
    name = "Demo Customer",
    accountNumber = "NB8577145",
    accountType = "Savings Account",
    balance = 84250.75
  } = user || {};

  // Dynamically calculate metrics using reduce()
  const metrics = useMemo(
    () => calculateFinancialMetrics(data.transactions, balance),
    [data.transactions, balance]
  );

  // Category expense breakdown calculation
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(data.transactions),
    [data.transactions]
  );

  // Monthly trends and MoM comparison
  const monthlyTrends = useMemo(
    () => calculateMonthlyTrends(data.transactions),
    [data.transactions]
  );

  // Available categories for dropdown
  const availableCategories = useMemo(
    () => getAvailableCategories(data.transactions),
    [data.transactions]
  );

  // Dynamically filter and sort transactions using non-mutating sort & filter
  const displayedTransactions = useMemo(
    () =>
      filterAndSortTransactions(data.transactions, {
        searchQuery,
        typeFilter,
        categoryFilter,
        startDate,
        endDate,
        sortBy
      }),
    [data.transactions, searchQuery, typeFilter, categoryFilter, startDate, endDate, sortBy]
  );

  /**
   * Helper function to return contextual icons for transaction categories
   */
  const getCategoryIcon = (category, type) => {
    if (type === "income") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
          <polyline points="7 11 12 6 17 11" />
          <line x1="12" y1="6" x2="12" y2="18" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
        <polyline points="17 13 12 18 7 13" />
        <line x1="12" y1="18" x2="12" y2="6" />
      </svg>
    );
  };

  /**
   * Smooth scroll helper for quick action buttons
   */
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation Bar */}
      <TopNavbar
        user={user}
        activePage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Loading your banking overview...</h2>
            <p>Fetching real-time balances and encrypted ledger records</p>
          </div>
        )}

        {/* Error State with Retry Button */}
        {!isLoading && error && (
          <div className="dashboard-error-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2>Unable to load dashboard data</h2>
            <p>{error}</p>
            <button
              type="button"
              className="dashboard-retry-btn"
              onClick={() => loadData()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && !error && (
          <>
            {/* Welcome & Status Banner */}
            <section className="dashboard-welcome">
              <div>
                <h1 className="dashboard-welcome__title">
                  {timeGreeting}, {name}
                </h1>
                <p className="dashboard-welcome__subtitle">
                  Here&apos;s your financial overview and real-time account performance.
                </p>
              </div>

              <div className="dashboard-welcome__actions">
                <DataSourceBadge source={data.source} />
                <div className="dashboard-status-badge">
                  <span className="status-dot" />
                  <span>Account Status: Active</span>
                </div>
              </div>
            </section>

            {/* Overview Section: Virtual Card + 4 Metric Summary Cards */}
            <section className="dashboard-overview-grid" id="account-summary-card">
              
              {/* Virtual Primary Account Card */}
              <div className="virtual-card">
                <div className="virtual-card__ambient" />
                
                <div className="virtual-card__top">
                  <div className="virtual-card__chip" />
                  <div className="virtual-card__contactless">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <path d="M8.5 14.5A2.5 2.5 0 0011 12a2.5 2.5 0 00-2.5-2.5" />
                      <path d="M5.5 17.5A6.5 6.5 0 0012 11a6.5 6.5 0 00-6.5-6.5" />
                      <path d="M2.5 20.5A10.5 10.5 0 0013 10a10.5 10.5 0 00-10.5-10.5" />
                    </svg>
                  </div>
                </div>

                <div>
                  <div className="virtual-card__balance-label">Total Available Balance</div>
                  <div className="virtual-card__balance">{formatCurrency(metrics.availableBalance)}</div>
                </div>

                <div className="virtual-card__bottom">
                  <div>
                    <div className="virtual-card__acc-num">{accountNumber}</div>
                    <div className="virtual-card__holder">{name} &bull; {accountType}</div>
                  </div>
                  <div className="virtual-card__brand">NexBank</div>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="stats-grid">
                
                {/* 1. Available Balance */}
                <div className="stat-card">
                  <div className="stat-card__header">
                    <span className="stat-card__title">Available Balance</span>
                    <div className="stat-card__icon stat-card__icon--blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card__value">{formatCurrency(metrics.availableBalance)}</div>
                  <div className="stat-card__trend stat-card__trend--success">
                    <span>&bull; Ready for instant transfer</span>
                  </div>
                </div>

                {/* 2. Monthly Income */}
                <div className="stat-card">
                  <div className="stat-card__header">
                    <span className="stat-card__title">Monthly Income</span>
                    <div className="stat-card__icon stat-card__icon--green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card__value">{formatCurrency(metrics.totalIncome)}</div>
                  <div className="stat-card__trend stat-card__trend--success">
                    <span>&bull; {data.transactions.filter(t => t.type === "income").length} credits this month</span>
                  </div>
                </div>

                {/* 3. Monthly Expenses */}
                <div className="stat-card">
                  <div className="stat-card__header">
                    <span className="stat-card__title">Monthly Expenses</span>
                    <div className="stat-card__icon stat-card__icon--red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card__value">{formatCurrency(metrics.totalExpenses)}</div>
                  <div className="stat-card__trend stat-card__trend--danger">
                    <span>&bull; {metrics.expensePercentage}% of monthly cashflow</span>
                  </div>
                </div>

                {/* 4. Net Savings */}
                <div className="stat-card">
                  <div className="stat-card__header">
                    <span className="stat-card__title">Net Savings</span>
                    <div className="stat-card__icon stat-card__icon--indigo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-card__value">{formatCurrency(metrics.netSavings)}</div>
                  <div className="stat-card__trend stat-card__trend--primary">
                    <span>&bull; {metrics.savingsPercentage}% savings retention</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Performance & Trends Section: Month-over-Month + Interactive Charts */}
            <MonthOverMonthCard comparison={monthlyTrends.momComparison} />

            <section className="dashboard-analytics-section" id="analytics-section">
              <MonthlyTrendChart data={monthlyTrends.monthlyData} />
              <CategoryBreakdownChart categories={categoryBreakdown} />
            </section>

            {/* Middle Section: Transaction Explorer + Side Panels */}
            <div className="dashboard-content-layout">
              
              {/* Transactions Explorer Card (Left) */}
              <section className="transactions-card" id="transactions-section">
                <div className="transactions-card__header">
                  <div className="transactions-card__title-group">
                    <h2 className="transactions-card__title">Recent Transactions</h2>
                    <span className="transactions-card__count">
                      {displayedTransactions.length} of {data.transactions.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="transactions-add-btn"
                    onClick={handleOpenAddExpense}
                    id="add-expense-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Expense</span>
                  </button>
                </div>

                {/* Search & Filter Controls (Semantic Controlled Form) */}
                <form
                  className="transactions-controls"
                  onSubmit={handleFilterSubmit}
                  role="search"
                  aria-label="Transaction search and filter form"
                >
                  {/* Search Input */}
                  <div className="transactions-search-wrapper">
                    <svg
                      className="transactions-search-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="18"
                      height="18"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="search"
                      className="transactions-search-input"
                      placeholder="Search transactions by title or category (e.g. Amazon, Salary, Shopping)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search transactions"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="transactions-search-clear"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search input"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  {/* Filter Pills, Category Select & Sort Select */}
                  <div className="transactions-filter-row">
                    <div className="transactions-type-pills" role="group" aria-label="Transaction type filter">
                      <button
                        type="button"
                        className={`type-pill-btn ${typeFilter === "all" ? "type-pill-btn--active" : ""}`}
                        onClick={() => setTypeFilter("all")}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`type-pill-btn ${typeFilter === "income" ? "type-pill-btn--active" : ""}`}
                        onClick={() => setTypeFilter("income")}
                      >
                        Income
                      </button>
                      <button
                        type="button"
                        className={`type-pill-btn ${typeFilter === "expense" ? "type-pill-btn--active" : ""}`}
                        onClick={() => setTypeFilter("expense")}
                      >
                        Expense
                      </button>
                    </div>

                    <div className="transactions-filter-actions">
                      <select
                        className="transactions-sort-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                      >
                        <option value="all">All Categories</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <select
                        className="transactions-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Sort transactions"
                      >
                        <option value="newest">Sort: Newest First</option>
                        <option value="oldest">Sort: Oldest First</option>
                        <option value="highest">Sort: Highest Amount</option>
                        <option value="lowest">Sort: Lowest Amount</option>
                      </select>

                      {(searchQuery || typeFilter !== "all" || categoryFilter !== "all" || startDate || endDate || sortBy !== "newest") && (
                        <button
                          type="button"
                          className="type-pill-btn"
                          onClick={handleResetFilters}
                          title="Reset all filters to default"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Secondary Filter Row: Date Range Filter */}
                  <div className="transactions-filter-row-secondary">
                    <div className="filter-date-group">
                      <span>From:</span>
                      <input
                        type="date"
                        className="filter-date-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Filter start date"
                      />
                    </div>
                    <div className="filter-date-group">
                      <span>To:</span>
                      <input
                        type="date"
                        className="filter-date-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="Filter end date"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button
                        type="button"
                        className="type-pill-btn filter-clear-dates-btn"
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                </form>

                {/* Transaction List */}
                <div className="transactions-list">
                  {displayedTransactions.length > 0 ? (
                    displayedTransactions.map((tx) => {
                      const isIncome = tx.type === "income";
                      const txKey = tx._id || tx.id || tx.transactionId;
                      return (
                        <div key={txKey} className="transaction-item">
                          <div className="transaction-item__left">
                            <div className={`transaction-item__icon ${isIncome ? "transaction-item__icon--income" : "transaction-item__icon--expense"}`}>
                              {getCategoryIcon(tx.category, tx.type)}
                            </div>
                            <div className="transaction-item__details">
                              <div className="transaction-item__title-row">
                                <span className="transaction-item__title">{tx.title}</span>
                                {tx.paymentMethod && (
                                  <span className="transaction-item__method-badge">{tx.paymentMethod}</span>
                                )}
                              </div>
                              <div className="transaction-item__meta">
                                <span>{tx.category}</span>
                                <span>&bull;</span>
                                <span>{tx.status || "Completed"}</span>
                                {tx.description && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="transaction-item__desc">{tx.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="transaction-item__right">
                            <div className="transaction-item__amount-group">
                              <span className={`transaction-item__amount ${isIncome ? "transaction-item__amount--income" : "transaction-item__amount--expense"}`}>
                                {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                              </span>
                              <span className="transaction-item__date">{formatTxDate(tx.date)}</span>
                            </div>
                            <div className="transaction-item__actions">
                              <button
                                type="button"
                                className="tx-action-btn tx-action-btn--edit"
                                onClick={() => handleOpenEditExpense(tx)}
                                title="Edit transaction"
                                aria-label={`Edit ${tx.title}`}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="tx-action-btn tx-action-btn--delete"
                                onClick={(e) => handleDeleteExpense(tx, e)}
                                title="Delete transaction"
                                aria-label={`Delete ${tx.title}`}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="transactions-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p>No transactions match &quot;{searchQuery}&quot; under the selected filter.</p>
                      {(searchQuery || typeFilter !== "all" || sortBy !== "newest") && (
                        <button
                          type="button"
                          className="transactions-reset-btn"
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Sidebar Panels (Right) */}
              <aside className="dashboard-sidebar">
                
                {/* 1. Spending Overview / Progress Bars */}
                <div className="spending-card">
                  <h3 className="spending-card__title">Spending &amp; Savings Ratio</h3>
                  <div className="spending-bars">
                    {/* Expenses Bar */}
                    <div className="spending-bar-group">
                      <div className="spending-bar-label">
                        <span>Expenses</span>
                        <span>{metrics.expensePercentage}% ({formatCurrency(metrics.totalExpenses)})</span>
                      </div>
                      <div className="spending-bar-track">
                        <div
                          className="spending-bar-fill spending-bar-fill--expense"
                          style={{ width: `${metrics.expensePercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Savings Bar */}
                    <div className="spending-bar-group">
                      <div className="spending-bar-label">
                        <span>Net Savings</span>
                        <span>{metrics.savingsPercentage}% ({formatCurrency(metrics.netSavings)})</span>
                      </div>
                      <div className="spending-bar-track">
                        <div
                          className="spending-bar-fill spending-bar-fill--savings"
                          style={{ width: `${metrics.savingsPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Quick Actions */}
                <div className="quick-actions-card">
                  <h3 className="quick-actions-card__title">Quick Actions</h3>
                  <div className="quick-actions-grid">
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={handleOpenAddExpense}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      <span>Add Expense</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => onNavigate && onNavigate("profile")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>View Profile</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => scrollToSection("transactions-section")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                      <span>View Transactions</span>
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => scrollToSection("account-summary-card")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <span>Account Details</span>
                    </button>
                  </div>
                </div>

                {/* 3. Recent Activity Log */}
                <div className="activity-card">
                  <h3 className="activity-card__title">Recent Activity</h3>
                  <div className="activity-list">
                    {data.recentActivities && data.recentActivities.map((act) => (
                      <div key={act.id} className="activity-item">
                        <div className="activity-icon">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="activity-text">{act.text}</p>
                          <span className="activity-time">{act.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </aside>
            </div>
          </>
        )}

        {/* Modal for Creating / Editing Transaction & Expense */}
        {isExpenseModalOpen && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isExpenseSubmitting) {
                setIsExpenseModalOpen(false);
              }
            }}
          >
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <span className="modal-badge">
                    {editingExpense ? "Ledger Edit" : "Expense & Income Entry"}
                  </span>
                  <h3 id="expense-modal-title" className="modal-title">
                    {editingExpense ? "Edit Transaction" : "Record Expense or Income"}
                  </h3>
                  <p className="modal-subtitle">
                    {editingExpense
                      ? "Update transaction details. This will recalculate balances and analytics."
                      : "Add an expense or deposit to keep your account balance and category analytics accurate."}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsExpenseModalOpen(false)}
                  disabled={isExpenseSubmitting}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {expenseModalError && (
                <div className="modal-error-banner" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{expenseModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="modal-form">
                {/* Transaction Type Selector */}
                <div className="modal-form-group">
                  <label className="modal-label">Transaction Type</label>
                  <div className="expense-type-toggle">
                    <button
                      type="button"
                      className={`expense-type-btn ${expenseForm.type === "expense" ? "expense-type-btn--expense-active" : ""}`}
                      onClick={() => setExpenseForm((prev) => ({ ...prev, type: "expense" }))}
                    >
                      Expense (Debit -)
                    </button>
                    <button
                      type="button"
                      className={`expense-type-btn ${expenseForm.type === "income" ? "expense-type-btn--income-active" : ""}`}
                      onClick={() => setExpenseForm((prev) => ({ ...prev, type: "income" }))}
                    >
                      Income (Credit +)
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="modal-form-group">
                  <label htmlFor="tx-title" className="modal-label">
                    Title / Payee Name *
                  </label>
                  <input
                    id="tx-title"
                    type="text"
                    className="modal-input"
                    placeholder="e.g. Grocery Store, Netflix Subscription, Client Payment"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    maxLength={100}
                    autoFocus
                  />
                </div>

                {/* Amount & Date in 2 columns */}
                <div className="form-grid-two">
                  <div className="modal-form-group">
                    <label htmlFor="tx-amount" className="modal-label">
                      Amount (₹) *
                    </label>
                    <input
                      id="tx-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="modal-input"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="tx-date" className="modal-label">
                      Date *
                    </label>
                    <input
                      id="tx-date"
                      type="date"
                      className="modal-input"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Category & Payment Method in 2 columns */}
                <div className="form-grid-two">
                  <div className="modal-form-group">
                    <label htmlFor="tx-category" className="modal-label">
                      Category *
                    </label>
                    <select
                      id="tx-category"
                      className="modal-select"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Shopping">Shopping</option>
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Bills & Utilities">Bills & Utilities</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Travel">Travel</option>
                      <option value="Health & Medical">Health & Medical</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Salary">Salary</option>
                      <option value="Investment">Investment</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label htmlFor="tx-method" className="modal-label">
                      Payment Method
                    </label>
                    <select
                      id="tx-method"
                      className="modal-select"
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option value="Debit Card">Debit Card</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="UPI / Net Banking">UPI / Net Banking</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description / Notes */}
                <div className="modal-form-group">
                  <label htmlFor="tx-description" className="modal-label">
                    Notes / Description (Optional)
                  </label>
                  <textarea
                    id="tx-description"
                    className="modal-textarea"
                    placeholder="Add any receipts, transaction references, or notes..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                    maxLength={300}
                  />
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setIsExpenseModalOpen(false)}
                    disabled={isExpenseSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={isExpenseSubmitting}
                  >
                    {isExpenseSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : editingExpense ? (
                      "Update Transaction"
                    ) : (
                      "Save Transaction"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {expenseToast && (
          <div className="dashboard-toast-success" role="status">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{expenseToast}</span>
          </div>
        )}

      </main>
    </div>
  );
}

export default DashboardPage;
