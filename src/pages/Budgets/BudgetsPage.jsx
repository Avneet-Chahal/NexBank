import React, { useState, useEffect, useMemo } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import {
  fetchBudgets,
  createOrUpdateBudget,
  deleteBudget,
  calculateBudgetStatus
} from "../../services/budgetService";
import { fetchDashboardData, formatCurrency } from "../../services/dashboardService";
import "./Budgets.css";

const AVAILABLE_CATEGORIES = [
  "Shopping",
  "Groceries",
  "Utilities",
  "Entertainment",
  "Food",
  "Travel",
  "Healthcare",
  "Education",
  "Investment",
  "Other"
];

export function BudgetsPage({ user, onNavigate, onLogout }) {
  // Active month in "YYYY-MM" format
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalForm, setModalForm] = useState({ category: "Shopping", amount: "" });
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [budgetRes, dashRes] = await Promise.all([
        fetchBudgets(selectedMonth),
        fetchDashboardData()
      ]);
      setBudgets(budgetRes.budgets || []);
      setDataSource(budgetRes.source || "Demo Store");
      setTransactions(dashRes.transactions || []);
    } catch (err) {
      console.error("Error loading budgets:", err);
      setError("Unable to retrieve monthly budget plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonthStr);
  };

  const monthDisplayLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  // Overall calculations across all category budgets
  const overallStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;

    budgets.forEach((b) => {
      totalBudget += Number(b.amount || 0);
      const { spent } = calculateBudgetStatus(b, transactions);
      totalSpent += spent;
    });

    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const isExceeded = percentage >= 100;
    const isWarning = percentage >= 80 && !isExceeded;

    return { totalBudget, totalSpent, totalRemaining, percentage, isExceeded, isWarning };
  }, [budgets, transactions]);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingBudget(null);
    setModalForm({ category: "Shopping", amount: "" });
    setModalError("");
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setModalForm({ category: budget.category, amount: budget.amount });
    setModalError("");
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const amt = Number(modalForm.amount);
    if (!amt || amt <= 0) {
      setModalError("Please enter a valid positive budget amount.");
      return;
    }

    try {
      await createOrUpdateBudget({
        category: modalForm.category,
        amount: amt,
        month: selectedMonth
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to save budget plan.");
    }
  };

  // Handle Delete
  const handleDeleteBudget = async (id) => {
    if (window.confirm("Are you sure you want to remove this category budget?")) {
      try {
        await deleteBudget(id);
        loadData();
      } catch (err) {
        alert("Failed to delete budget: " + err.message);
      }
    }
  };

  return (
    <div className="budgets-layout">
      <TopNavbar
        user={user}
        activePage="budgets"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="budgets-main">
        {/* Header */}
        <div className="budgets-header">
          <div>
            <h1 className="budgets-header__title">Budget Planner</h1>
            <p className="budgets-header__subtitle">
              Set spending limits and automatically track expenses against your live records.
            </p>
          </div>

          <div className="budgets-header__actions">
            <DataSourceBadge source={dataSource} />

            {/* Month Selector */}
            <div className="month-selector">
              <button
                type="button"
                className="month-selector__btn"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                &larr;
              </button>
              <span className="month-selector__label">{monthDisplayLabel}</span>
              <button
                type="button"
                className="month-selector__btn"
                onClick={handleNextMonth}
                title="Next month"
              >
                &rarr;
              </button>
            </div>

            <button
              type="button"
              className="create-budget-btn"
              onClick={handleOpenCreate}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Budget</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Loading your monthly budget plan...</h2>
          </div>
        )}

        {!isLoading && error && (
          <div className="dashboard-error-card">
            <h2>Error Loading Budgets</h2>
            <p>{error}</p>
            <button type="button" className="dashboard-retry-btn" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Overall Monthly Overview Banner */}
            <section className="budget-overview-card">
              <div className="budget-overview-grid">
                <div className="budget-overview-stat">
                  <span className="budget-overview-label">Total Monthly Budget</span>
                  <span className="budget-overview-val">{formatCurrency(overallStats.totalBudget)}</span>
                </div>
                <div className="budget-overview-stat">
                  <span className="budget-overview-label">Actual Spent</span>
                  <span className="budget-overview-val text-error">
                    {formatCurrency(overallStats.totalSpent)}
                  </span>
                </div>
                <div className="budget-overview-stat">
                  <span className="budget-overview-label">Remaining Margin</span>
                  <span className="budget-overview-val text-success">
                    {formatCurrency(overallStats.totalRemaining)}
                  </span>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="budget-overview-progress-section">
                <div className="budget-overview-progress-header">
                  <span>Overall Monthly Spend: {overallStats.percentage}%</span>
                  <span className={`budget-overview-status-pill ${
                    overallStats.isExceeded
                      ? "budget-overview-status-pill--danger"
                      : overallStats.isWarning
                      ? "budget-overview-status-pill--warning"
                      : "budget-overview-status-pill--normal"
                  }`}>
                    {overallStats.isExceeded ? "Exceeded Budget!" : overallStats.isWarning ? "Approaching Limit (80%+)" : "On Track"}
                  </span>
                </div>
                <div className="budget-progress-track">
                  <div
                    className={`budget-progress-bar ${
                      overallStats.isExceeded
                        ? "budget-progress-bar--danger"
                        : overallStats.isWarning
                        ? "budget-progress-bar--warning"
                        : "budget-progress-bar--normal"
                    }`}
                    style={{ width: `${Math.min(100, overallStats.percentage)}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Category Budgets Grid */}
            {budgets.length > 0 ? (
              <div className="budgets-grid">
                {budgets.map((b) => {
                  const status = calculateBudgetStatus(b, transactions);
                  const isWarning = status.isWarning;
                  const isExceeded = status.isExceeded;

                  return (
                    <div
                      key={b.id || b._id}
                      className={`budget-card ${isExceeded ? "budget-card--danger" : isWarning ? "budget-card--warning" : ""}`}
                    >
                      <div className="budget-card__header">
                        <div className="budget-card__category-wrap">
                          <div className="budget-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </div>
                          <span className="budget-card__cat-title">{b.category}</span>
                        </div>

                        <span
                          className={`budget-card__status-badge ${
                            isExceeded
                              ? "budget-card__status-badge--danger"
                              : isWarning
                              ? "budget-card__status-badge--warning"
                              : "budget-card__status-badge--normal"
                          }`}
                        >
                          {isExceeded ? "Over Budget" : isWarning ? "80% Alert" : "On Track"}
                        </span>
                      </div>

                      {/* Spent vs Budget */}
                      <div className="budget-card__numbers">
                        <div>
                          <span className="budget-card__numbers-spent">{formatCurrency(status.spent)}</span>
                          <span className="budget-spent-sub"> spent</span>
                        </div>
                        <div className="budget-card__numbers-total">
                          Limit: {formatCurrency(b.amount)}
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="budget-progress-track budget-progress-track--card">
                        <div
                          className={`budget-progress-bar ${
                            isExceeded
                              ? "budget-progress-bar--danger"
                              : isWarning
                              ? "budget-progress-bar--warning"
                              : "budget-progress-bar--normal"
                          }`}
                          style={{ width: `${Math.min(100, status.percentage)}%` }}
                        />
                      </div>

                      {/* Remaining amount */}
                      <div className="budget-card__remaining">
                        <span>{status.percentage}% used</span>
                        <span className={status.remaining < 0 ? "text-error" : ""}>
                          {status.remaining >= 0
                            ? `${formatCurrency(status.remaining)} remaining`
                            : `${formatCurrency(Math.abs(status.remaining))} exceeded`}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="budget-card__actions">
                        <button
                          type="button"
                          className="budget-card-btn"
                          onClick={() => handleOpenEdit(b)}
                        >
                          Edit Limit
                        </button>
                        <button
                          type="button"
                          className="budget-card-btn budget-card-btn--delete"
                          onClick={() => handleDeleteBudget(b.id || b._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="budgets-empty-card">
                <div className="budgets-empty-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3>No budgets set for {monthDisplayLabel}</h3>
                <p>Establish category limits to monitor spending and receive real-time threshold warnings.</p>
                <button
                  type="button"
                  className="create-budget-btn"
                  onClick={handleOpenCreate}
                >
                  Create Your First Budget
                </button>
              </div>
            )}
          </>
        )}

        {/* Create / Edit Budget Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-badge">{editingBudget ? "MODIFY LIMIT" : "NEW ALLOCATION"}</span>
                  <h3 className="modal-title">
                    {editingBudget ? "Edit Category Budget" : "Create Category Budget"}
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {modalError && (
                <div className="form-error-alert">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveBudget}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                    disabled={!!editingBudget}
                  >
                    {AVAILABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Limit (INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000"
                    min="100"
                    step="100"
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Applied Period</label>
                  <input
                    type="text"
                    className="form-input"
                    value={monthDisplayLabel}
                    disabled
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BudgetsPage;
