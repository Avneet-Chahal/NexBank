import React, { useState, useEffect, useMemo } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal
} from "../../services/savingsService";
import { formatCurrency } from "../../services/dashboardService";
import "./SavingsGoals.css";

const GOAL_CATEGORIES = ["Emergency", "Gadgets", "Education", "Travel", "Home", "Vehicle", "General"];

export function SavingsGoalsPage({ user, onNavigate, onLogout }) {
  const [goals, setGoals] = useState([]);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [tabFilter, setTabFilter] = useState("all"); // 'all' | 'active' | 'completed'
  const [sortBy, setSortBy] = useState("deadline"); // 'deadline' | 'progress' | 'target'

  // Modal States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "0",
    targetDate: "",
    category: "General"
  });
  const [modalError, setModalError] = useState("");

  // Quick Contribution Modal State
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributeTargetGoal, setContributeTargetGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeAction, setContributeAction] = useState("deposit"); // 'deposit' | 'withdraw'

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchGoals();
      setGoals(res.goals || []);
      setDataSource(res.source || "Demo Store");
    } catch (err) {
      console.error("Failed to load savings goals:", err);
      setError("Unable to retrieve savings goals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGoal(null);
    setGoalForm({
      name: "",
      targetAmount: "",
      savedAmount: "0",
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      category: "General"
    });
    setModalError("");
    setIsGoalModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    const dateFormatted = goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : "";
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      targetDate: dateFormatted,
      category: goal.category || "General"
    });
    setModalError("");
    setIsGoalModalOpen(true);
  };

  // Handle Save Goal
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.name.trim()) {
      setModalError("Please provide a name for your savings goal.");
      return;
    }
    const target = Number(goalForm.targetAmount);
    if (!target || target <= 0) {
      setModalError("Target amount must be a positive number.");
      return;
    }
    if (!goalForm.targetDate) {
      setModalError("Target completion date is required.");
      return;
    }

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id || editingGoal._id, {
          name: goalForm.name,
          targetAmount: target,
          savedAmount: Number(goalForm.savedAmount || 0),
          targetDate: goalForm.targetDate,
          category: goalForm.category
        });
      } else {
        await createGoal({
          name: goalForm.name,
          targetAmount: target,
          savedAmount: Number(goalForm.savedAmount || 0),
          targetDate: goalForm.targetDate,
          category: goalForm.category
        });
      }
      setIsGoalModalOpen(false);
      loadGoals();
    } catch (err) {
      setModalError(err.message || "Failed to save savings goal.");
    }
  };

  // Open Contribution Modal
  const handleOpenContribute = (goal) => {
    setContributeTargetGoal(goal);
    setContributeAmount("");
    setContributeAction("deposit");
    setIsContributeModalOpen(true);
  };

  // Process Contribution
  const handleProcessContribution = async (e) => {
    e.preventDefault();
    const amt = Number(contributeAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const delta = contributeAction === "withdraw" ? -amt : amt;

    try {
      await contributeToGoal(contributeTargetGoal.id || contributeTargetGoal._id, delta);
      setIsContributeModalOpen(false);
      loadGoals();
    } catch (err) {
      alert("Contribution failed: " + err.message);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id) => {
    if (window.confirm("Are you sure you want to delete this savings goal?")) {
      try {
        await deleteGoal(id);
        loadGoals();
      } catch (err) {
        alert("Failed to delete goal: " + err.message);
      }
    }
  };

  // Filter & Sort
  const displayedGoals = useMemo(() => {
    let list = [...goals];

    // Filter
    if (tabFilter === "active") {
      list = list.filter((g) => !g.isCompleted);
    } else if (tabFilter === "completed") {
      list = list.filter((g) => g.isCompleted);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      if (sortBy === "progress") {
        const pctA = a.targetAmount > 0 ? (a.savedAmount / a.targetAmount) : 0;
        const pctB = b.targetAmount > 0 ? (b.savedAmount / b.targetAmount) : 0;
        return pctB - pctA;
      }
      if (sortBy === "target") {
        return b.targetAmount - a.targetAmount;
      }
      return 0;
    });

    return list;
  }, [goals, tabFilter, sortBy]);

  // Aggregate stats
  const totalSaved = useMemo(() => goals.reduce((acc, g) => acc + Number(g.savedAmount || 0), 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((acc, g) => acc + Number(g.targetAmount || 0), 0), [goals]);
  const completedCount = useMemo(() => goals.filter((g) => g.isCompleted).length, [goals]);

  return (
    <div className="goals-layout">
      <TopNavbar
        user={user}
        activePage="savings"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="goals-main">
        {/* Header */}
        <div className="goals-header">
          <div>
            <h1 className="goals-header__title">Savings Goals</h1>
            <p className="goals-header__subtitle">
              Plan and simulate contributions towards your financial aspirations and milestones.
            </p>
          </div>

          <div className="goals-header__actions">
            <DataSourceBadge source={dataSource} />
            <button type="button" className="create-budget-btn" onClick={handleOpenCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Aggregate Overview Card */}
        <section className="budget-overview-card" style={{ marginBottom: "28px" }}>
          <div className="budget-overview-grid">
            <div className="budget-overview-stat">
              <span className="budget-overview-label">Total Capital Saved</span>
              <span className="budget-overview-val text-success">{formatCurrency(totalSaved)}</span>
            </div>
            <div className="budget-overview-stat">
              <span className="budget-overview-label">Total Target Capital</span>
              <span className="budget-overview-val">{formatCurrency(totalTarget)}</span>
            </div>
            <div className="budget-overview-stat">
              <span className="budget-overview-label">Completed Milestones</span>
              <span className="budget-overview-val" style={{ color: "#60A5FA" }}>
                {completedCount} of {goals.length} Goals
              </span>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="goals-filter-bar">
          <div className="goals-tabs">
            <button
              type="button"
              className={`goal-tab-btn ${tabFilter === "all" ? "goal-tab-btn--active" : ""}`}
              onClick={() => setTabFilter("all")}
            >
              All Goals ({goals.length})
            </button>
            <button
              type="button"
              className={`goal-tab-btn ${tabFilter === "active" ? "goal-tab-btn--active" : ""}`}
              onClick={() => setTabFilter("active")}
            >
              In Progress ({goals.filter((g) => !g.isCompleted).length})
            </button>
            <button
              type="button"
              className={`goal-tab-btn ${tabFilter === "completed" ? "goal-tab-btn--active" : ""}`}
              onClick={() => setTabFilter("completed")}
            >
              Completed ({completedCount})
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>Sort:</span>
            <select
              className="goals-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort savings goals"
            >
              <option value="deadline">Target Date (Earliest First)</option>
              <option value="progress">Progress % (Highest First)</option>
              <option value="target">Target Amount (Highest First)</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Loading your savings goals...</h2>
          </div>
        )}

        {!isLoading && error && (
          <div className="dashboard-error-card">
            <h2>Error Loading Goals</h2>
            <p>{error}</p>
            <button type="button" className="dashboard-retry-btn" onClick={loadGoals}>
              Retry
            </button>
          </div>
        )}

        {/* Goals Grid */}
        {!isLoading && !error && (
          <>
            {displayedGoals.length > 0 ? (
              <div className="goals-grid">
                {displayedGoals.map((goal) => {
                  const target = Number(goal.targetAmount);
                  const saved = Number(goal.savedAmount);
                  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                  const isDone = goal.isCompleted || pct >= 100;
                  const deadlineStr = goal.targetDate
                    ? new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "No deadline";

                  return (
                    <div
                      key={goal.id || goal._id}
                      className={`goal-card ${isDone ? "goal-card--completed" : ""}`}
                    >
                      <div className="goal-card__top">
                        <span
                          className={`goal-card__badge ${
                            isDone ? "goal-card__badge--completed" : "goal-card__badge--active"
                          }`}
                        >
                          {isDone ? "Goal Achieved!" : goal.category || "Active Goal"}
                        </span>
                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: isDone ? "#059669" : "#0052FF" }}>
                          {pct}%
                        </span>
                      </div>

                      <h3 className="goal-card__title">{goal.name}</h3>
                      <div className="goal-card__meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Target: {deadlineStr}</span>
                      </div>

                      <div className="goal-card__amounts">
                        <span className="goal-card__saved">{formatCurrency(saved)}</span>
                        <span className="goal-card__target">Target: {formatCurrency(target)}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="goal-progress-track">
                        <div
                          className={`goal-progress-bar ${isDone ? "goal-progress-bar--completed" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="goal-card__footer-info">
                        <span>{isDone ? "Fully Funded" : `${formatCurrency(Math.max(0, target - saved))} to go`}</span>
                        <span>{isDone ? "Completed" : "In Progress"}</span>
                      </div>

                      {/* Actions */}
                      <div className="goal-card__actions">
                        <button
                          type="button"
                          className="goal-contribute-btn"
                          onClick={() => handleOpenContribute(goal)}
                        >
                          Simulate Contribution
                        </button>
                        <div className="goal-secondary-actions">
                          <button
                            type="button"
                            className="budget-card-btn"
                            onClick={() => handleOpenEdit(goal)}
                            title="Edit goal"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="budget-card-btn budget-card-btn--delete"
                            onClick={() => handleDeleteGoal(goal.id || goal._id)}
                            title="Delete goal"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty-state" style={{ backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)", padding: "48px 24px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                <h3>No savings goals found in this view</h3>
                <p>Create dedicated savings goals to set targets and simulate progressive savings milestones.</p>
                <button
                  type="button"
                  className="create-budget-btn"
                  style={{ marginTop: "16px" }}
                  onClick={handleOpenCreate}
                >
                  Create Your First Goal
                </button>
              </div>
            )}
          </>
        )}

        {/* Create / Edit Goal Modal */}
        {isGoalModalOpen && (
          <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
                </h3>
                <button type="button" className="modal-close-btn" onClick={() => setIsGoalModalOpen(false)}>
                  &times;
                </button>
              </div>

              {modalError && (
                <div style={{ color: "#EF4444", fontSize: "0.85rem", marginBottom: "12px", fontWeight: "500" }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveGoal}>
                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MacBook Pro M-Series"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Amount (INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 150000"
                    min="100"
                    step="100"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Saved Amount (INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 25000"
                    min="0"
                    step="100"
                    value={goalForm.savedAmount}
                    onChange={(e) => setGoalForm({ ...goalForm, savedAmount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Completion Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsGoalModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Contribution Modal */}
        {isContributeModalOpen && contributeTargetGoal && (
          <div className="modal-overlay" onClick={() => setIsContributeModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Simulate Contribution</h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748B" }}>
                    For {contributeTargetGoal.name}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsContributeModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  color: "#475569",
                  marginBottom: "16px",
                  border: "1px solid #E2E8F0"
                }}
              >
                <strong>Academic Portfolio Disclaimer:</strong> This simulates a balance contribution towards your educational project goal. No real monetary transactions take place.
              </div>

              <form onSubmit={handleProcessContribution}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button
                    type="button"
                    className={`type-pill-btn ${contributeAction === "deposit" ? "type-pill-btn--active" : ""}`}
                    style={{ flex: 1, padding: "8px" }}
                    onClick={() => setContributeAction("deposit")}
                  >
                    + Add Funds
                  </button>
                  <button
                    type="button"
                    className={`type-pill-btn ${contributeAction === "withdraw" ? "type-pill-btn--active" : ""}`}
                    style={{ flex: 1, padding: "8px" }}
                    onClick={() => setContributeAction("withdraw")}
                  >
                    - Withdraw Funds
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {[1000, 2500, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="type-pill-btn"
                      style={{ fontSize: "0.78rem" }}
                      onClick={() => setContributeAmount(String(preset))}
                    >
                      +₹{preset.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {contributeAction === "deposit" ? "Amount to Add (INR)" : "Amount to Withdraw (INR)"}
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000"
                    min="100"
                    step="100"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsContributeModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {contributeAction === "deposit" ? "Confirm Simulated Deposit" : "Confirm Simulated Withdrawal"}
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

export default SavingsGoalsPage;
