import React, { useState, useEffect } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import {
  fetchDashboardData,
  calculateFinancialMetrics,
  filterAndSortTransactions,
  formatCurrency
} from "../../services/dashboardService";
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
  const [data, setData] = useState({ transactions: [], recentActivities: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for transaction search, filter & sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Load Dashboard Data asynchronously on component mount
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Asynchronous function to fetch and populate dashboard data
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await fetchDashboardData();
      setData(responseData);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
  const metrics = calculateFinancialMetrics(data.transactions, balance);

  // Dynamically filter and sort transactions using non-mutating sort & filter
  const displayedTransactions = filterAndSortTransactions(
    data.transactions,
    searchQuery,
    typeFilter,
    sortBy
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
              onClick={loadData}
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

              <div className="dashboard-status-badge">
                <span className="status-dot" />
                <span>Account Status: Active</span>
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
                  <div className="stat-card__trend" style={{ color: "#10B981" }}>
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
                  <div className="stat-card__trend" style={{ color: "#10B981" }}>
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
                  <div className="stat-card__trend" style={{ color: "#EF4444" }}>
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
                  <div className="stat-card__trend" style={{ color: "#4F46E5" }}>
                    <span>&bull; {metrics.savingsPercentage}% savings retention</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Middle Section: Transaction Explorer + Side Panels */}
            <div className="dashboard-content-layout">
              
              {/* Transactions Explorer Card (Left) */}
              <section className="transactions-card" id="transactions-section">
                <div className="transactions-card__header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 className="transactions-card__title">Recent Transactions</h2>
                    <span className="transactions-card__count">
                      {displayedTransactions.length} of {data.transactions.length}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="transactions-controls">
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
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="transactions-search-input"
                      placeholder="Search transactions by title or category (e.g. Amazon, Salary, Shopping)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter Pills & Sort Select */}
                  <div className="transactions-filter-row">
                    <div className="transactions-type-pills">
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
                  </div>
                </div>

                {/* Transaction List */}
                <div className="transactions-list">
                  {displayedTransactions.length > 0 ? (
                    displayedTransactions.map((tx) => {
                      const isIncome = tx.type === "income";
                      return (
                        <div key={tx.id} className="transaction-item">
                          <div className="transaction-item__left">
                            <div className={`transaction-item__icon ${isIncome ? "transaction-item__icon--income" : "transaction-item__icon--expense"}`}>
                              {getCategoryIcon(tx.category, tx.type)}
                            </div>
                            <div className="transaction-item__details">
                              <span className="transaction-item__title">{tx.title}</span>
                              <div className="transaction-item__meta">
                                <span>{tx.category}</span>
                                <span>&bull;</span>
                                <span>{tx.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="transaction-item__right">
                            <span className={`transaction-item__amount ${isIncome ? "transaction-item__amount--income" : "transaction-item__amount--expense"}`}>
                              {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                            </span>
                            <span className="transaction-item__date">{tx.date}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="transactions-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p>No transactions match &quot;{searchQuery}&quot; under the selected filter.</p>
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
      </main>
    </div>
  );
}

export default DashboardPage;
