import React, { useState, useEffect, useMemo } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import { fetchDashboardData, formatCurrency } from "../../services/dashboardService";
import { getAuthToken } from "../../services/authService";
import "./Statements.css";

export function StatementsPage({ user, onNavigate, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Receipt Modal
  const [receiptTx, setReceiptTx] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardData();
      setTransactions(res.transactions || []);
      setDataSource(res.source || "Demo Store");
    } catch (err) {
      console.error("Failed to load statement transactions:", err);
      setError("Unable to load transactions for statement generation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset handlers
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "30days") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === "90days") {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (typeFilter !== "all") {
      list = list.filter((t) => t.type && t.type.toLowerCase() === typeFilter.toLowerCase());
    }

    if (startDate || endDate) {
      const startTs = startDate ? new Date(startDate).getTime() : null;
      const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

      list = list.filter((t) => {
        if (!t.date) return true;
        const txTime = new Date(t.date).getTime();
        if (startTs && txTime < startTs) return false;
        if (endTs && txTime > endTs) return false;
        return true;
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, startDate, endDate]);

  // Aggregate metrics
  const totalCredits = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filteredTransactions]
  );

  const totalDebits = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filteredTransactions]
  );

  const baseBalance = user?.balance || 84250.75;
  const netStatementChange = totalCredits - totalDebits;

  // CSV Export with Node.js Stream Backend support + resilient client fallback
  const handleExportCSV = async () => {
    const token = getAuthToken();

    // 1. Try server streaming endpoint
    if (token) {
      try {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("from", startDate);
        if (endDate) queryParams.append("to", endDate);
        if (typeFilter !== "all") queryParams.append("type", typeFilter);

        const res = await fetch(`http://localhost:5000/api/accounts/statement/export?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `nexbank_statement_${Date.now()}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend streaming export unavailable, using client-side generator:", backendErr.message);
      }
    }

    // 2. Client-side fallback generator
    const escapeCsv = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
    const rows = [
      ["Transaction ID", "Date", "Description", "Category", "Type", "Amount (INR)", "Status"]
    ];

    filteredTransactions.forEach((tx) => {
      rows.push([
        tx.id || tx.transactionId,
        tx.date,
        tx.title,
        tx.category,
        tx.type ? tx.type.toUpperCase() : "EXPENSE",
        Number(tx.amount || 0).toFixed(2),
        tx.status || "Completed"
      ]);
    });

    const csvContent = rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexbank_statement_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="statements-layout">
      <TopNavbar
        user={user}
        activePage="statements"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="statements-main">
        {/* Header */}
        <div className="statements-header">
          <div>
            <h1 className="statements-header__title">Account Statements</h1>
            <p className="statements-header__subtitle">
              Inspect verified transaction ledgers, export streaming CSV records, or generate official digital receipts.
            </p>
          </div>

          <div className="statements-header__actions">
            <DataSourceBadge source={dataSource} />
            <button
              type="button"
              className="statement-action-btn statement-action-btn--secondary"
              onClick={handleExportCSV}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="statement-action-btn statement-action-btn--primary"
              onClick={handlePrintStatement}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <section className="statement-filter-card">
          <div className="statement-filter-row">
            {/* Quick presets */}
            <div className="preset-pills">
              <button
                type="button"
                className={`type-pill-btn ${datePreset === "all" ? "type-pill-btn--active" : ""}`}
                onClick={() => handlePresetChange("all")}
              >
                All Records
              </button>
              <button
                type="button"
                className={`type-pill-btn ${datePreset === "month" ? "type-pill-btn--active" : ""}`}
                onClick={() => handlePresetChange("month")}
              >
                This Month
              </button>
              <button
                type="button"
                className={`type-pill-btn ${datePreset === "30days" ? "type-pill-btn--active" : ""}`}
                onClick={() => handlePresetChange("30days")}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`type-pill-btn ${datePreset === "90days" ? "type-pill-btn--active" : ""}`}
                onClick={() => handlePresetChange("90days")}
              >
                Last 90 Days
              </button>
            </div>

            {/* Date Pickers & Type */}
            <div className="date-inputs-wrap">
              <input
                type="date"
                className="filter-date-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                aria-label="Statement start date"
              />
              <span style={{ color: "#94A3B8" }}>to</span>
              <input
                type="date"
                className="filter-date-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                aria-label="Statement end date"
              />

              <select
                className="transactions-sort-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter transaction flow"
              >
                <option value="all">All Cashflow</option>
                <option value="income">Credits Only</option>
                <option value="expense">Debits Only</option>
              </select>
            </div>
          </div>
        </section>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Compiling verified account statement...</h2>
          </div>
        )}

        {!isLoading && error && (
          <div className="dashboard-error-card">
            <h2>Error Compiling Statement</h2>
            <p>{error}</p>
            <button type="button" className="dashboard-retry-btn" onClick={loadTransactions}>
              Retry
            </button>
          </div>
        )}

        {/* Printable Official Statement Document */}
        {!isLoading && !error && (
          <div className="statement-doc-card">
            {/* Bank Header */}
            <div className="statement-doc-header">
              <div>
                <h2 className="statement-doc-title">NexBank Digital Banking</h2>
                <p className="statement-doc-meta">
                  Official Periodic Account Statement &bull; Academic Portfolio Prototype
                </p>
                <p className="statement-doc-meta">
                  Statement Period: {startDate || "Beginning of Ledger"} to {endDate || "Present"}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <strong style={{ fontSize: "1.1rem", color: "var(--navy-900)" }}>{user?.name || "Demo Customer"}</strong>
                <p className="statement-doc-meta">Account: {user?.accountNumber || "NB8577145"}</p>
                <p className="statement-doc-meta">{user?.accountType || "Savings Account"}</p>
              </div>
            </div>

            {/* Financial Summary Bar */}
            <div className="statement-summary-bar">
              <div className="summary-bar-stat">
                <label>Opening / Base Ledger</label>
                <span>{formatCurrency(baseBalance)}</span>
              </div>
              <div className="summary-bar-stat">
                <label>Total Credits (+)</label>
                <span className="text-success">+{formatCurrency(totalCredits)}</span>
              </div>
              <div className="summary-bar-stat">
                <label>Total Debits (-)</label>
                <span className="text-error">-{formatCurrency(totalDebits)}</span>
              </div>
              <div className="summary-bar-stat">
                <label>Net Period Impact</label>
                <span style={{ color: netStatementChange >= 0 ? "#10B981" : "#EF4444" }}>
                  {netStatementChange >= 0 ? "+" : ""}{formatCurrency(netStatementChange)}
                </span>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="statement-table-wrap">
              {filteredTransactions.length > 0 ? (
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference ID</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount (INR)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isIncome = tx.type === "income";
                      return (
                        <tr key={tx.id || tx.transactionId}>
                          <td>{tx.date}</td>
                          <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                            {tx.transactionId || tx.id}
                          </td>
                          <td style={{ fontWeight: "600" }}>{tx.title}</td>
                          <td>{tx.category}</td>
                          <td>
                            <span
                              style={{
                                color: isIncome ? "#059669" : "#DC2626",
                                fontWeight: "700",
                                fontSize: "0.78rem"
                              }}
                            >
                              {isIncome ? "CREDIT" : "DEBIT"}
                            </span>
                          </td>
                          <td style={{ fontWeight: "700" }}>
                            {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                          </td>
                          <td>
                            <span style={{ color: "#10B981", fontWeight: "600", fontSize: "0.8rem" }}>
                              {tx.status || "Completed"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="view-receipt-link"
                              onClick={() => setReceiptTx(tx)}
                            >
                              Receipt &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="chart-empty-state">
                  <p>No transactions match the selected statement date range.</p>
                </div>
              )}
            </div>

            {/* Statement Verification Footer */}
            <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px dashed #E2E8F0", fontSize: "0.78rem", color: "#94A3B8", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <span>Verified via NexShield™ 256-Bit Ledger Verification</span>
              <span>Generated on {new Date().toLocaleString()} &bull; Page 1 of 1</span>
            </div>
          </div>
        )}

        {/* Digital Transaction Receipt Modal */}
        {receiptTx && (
          <div className="modal-overlay" onClick={() => setReceiptTx(null)}>
            <div className="receipt-card" onClick={(e) => e.stopPropagation()}>
              <div className="receipt-header">
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0052FF", letterSpacing: "0.08em" }}>
                  NEXBANK DIGITAL RECEIPT
                </span>
                <h3 style={{ fontSize: "1.25rem", color: "var(--navy-900)", marginTop: "4px" }}>
                  Transaction Verified
                </h3>
                <div className="receipt-amount-box" style={{ color: receiptTx.type === "income" ? "#10B981" : "#0F172A" }}>
                  {receiptTx.type === "income" ? "+" : "-"} {formatCurrency(receiptTx.amount)}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                  {receiptTx.title} &bull; {receiptTx.category}
                </span>
              </div>

              <div className="receipt-rows">
                <div className="receipt-row">
                  <span className="receipt-row-label">Reference ID</span>
                  <span className="receipt-row-value">{receiptTx.transactionId || receiptTx.id}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-row-label">Transaction Date</span>
                  <span className="receipt-row-value">{receiptTx.date}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-row-label">Customer Account</span>
                  <span className="receipt-row-value">{user?.accountNumber || "NB8577145"}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-row-label">Payment Channel</span>
                  <span className="receipt-row-value">NexBank Core Clearing</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-row-label">Audit Status</span>
                  <span className="receipt-row-value" style={{ color: "#10B981" }}>
                    &bull; {receiptTx.status || "Completed"}
                  </span>
                </div>
              </div>

              <div className="receipt-security-token">
                SHA256: e8a91bf97e204c3...{receiptTx.id || receiptTx.transactionId}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReceiptTx(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StatementsPage;
