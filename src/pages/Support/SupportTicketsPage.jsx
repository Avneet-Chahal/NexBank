import React, { useState, useEffect } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import { fetchTickets, createTicket } from "../../services/ticketService";
import { fetchDashboardData, formatCurrency } from "../../services/dashboardService";
import "./SupportTickets.css";

const ISSUE_CATEGORIES = [
  "Card Dispute",
  "Transaction Query",
  "Technical Bug",
  "Account Verification",
  "General Inquiry"
];

export function SupportTicketsPage({ user, onNavigate, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [form, setForm] = useState({
    category: "Transaction Query",
    subject: "",
    description: "",
    transactionReference: "",
    priority: "Normal"
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ticketRes, dashRes] = await Promise.all([
        fetchTickets(),
        fetchDashboardData()
      ]);
      setTickets(ticketRes.tickets || []);
      setDataSource(ticketRes.source || "Demo Store");
      setUserTransactions(dashRes.transactions || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Unable to retrieve support tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      category: "Transaction Query",
      subject: "",
      description: "",
      transactionReference: "",
      priority: "Normal"
    });
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setFormError("Please enter a subject line.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Please describe the issue in detail.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await createTicket(form);
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || "Failed to submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-tickets-layout">
      <TopNavbar
        user={user}
        activePage="support-tickets"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="support-tickets-main">
        {/* Header */}
        <div className="tickets-header">
          <div>
            <h1 className="tickets-header__title">Customer Support &amp; Disputes</h1>
            <p className="tickets-header__subtitle">
              Submit dispute claims, report transaction inquiries, and track resolution tickets.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <DataSourceBadge source={dataSource} />
            <button type="button" className="create-budget-btn" onClick={handleOpenCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Submit Ticket</span>
            </button>
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div className="academic-support-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Educational Demonstration Notice:</strong> This ticketing portal demonstrates authenticated customer dispute workflows, schema persistence, and transaction cross-referencing. It is not staffed by live commercial banking agents.
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Loading support tickets...</h2>
          </div>
        )}

        {!isLoading && error && (
          <div className="dashboard-error-card">
            <h2>Error Loading Tickets</h2>
            <p>{error}</p>
            <button type="button" className="dashboard-retry-btn" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {/* Tickets Grid */}
        {!isLoading && !error && (
          <>
            {tickets.length > 0 ? (
              <div className="tickets-grid">
                {tickets.map((t) => {
                  const ticketId = t.id || t.ticketId;
                  const statusClass = `ticket-card__status--${(t.status || "Open").replace(" ", "_")}`;

                  return (
                    <div
                      key={ticketId}
                      className="ticket-card"
                      onClick={() => setSelectedTicket(t)}
                    >
                      <div className="ticket-card__header">
                        <span className="ticket-card__ref">{ticketId}</span>
                        <span className={`ticket-card__status ${statusClass}`}>{t.status || "Open"}</span>
                      </div>

                      <h3 className="ticket-card__subject">{t.subject}</h3>
                      <p className="ticket-card__desc">{t.description}</p>

                      <div className="ticket-card__footer">
                        <span>
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "Recently submitted"}
                        </span>
                        {t.transactionReference && (
                          <span className="ticket-card__tx-ref">
                            Ref: {t.transactionReference}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty-state" style={{ backgroundColor: "var(--white)", borderRadius: "var(--radius-xl)", padding: "48px 24px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <h3>No support tickets filed</h3>
                <p>If you experience an issue or wish to dispute a transaction, submit a ticket for tracking.</p>
                <button type="button" className="create-budget-btn" style={{ marginTop: "16px" }} onClick={handleOpenCreate}>
                  Submit a Support Ticket
                </button>
              </div>
            )}
          </>
        )}

        {/* Create Ticket Modal */}
        {isCreateModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Submit Support Ticket</h3>
                <button type="button" className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
                  &times;
                </button>
              </div>

              {formError && (
                <div style={{ color: "#EF4444", fontSize: "0.85rem", marginBottom: "12px", fontWeight: "500" }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitTicket}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {ISSUE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Associated Transaction (Optional)</label>
                  <select
                    className="form-select"
                    value={form.transactionReference}
                    onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  >
                    <option value="">None / General Inquiry</option>
                    {userTransactions.map((tx) => (
                      <option key={tx.id || tx.transactionId} value={tx.transactionId || tx.id}>
                        {tx.transactionId || tx.id} &bull; {tx.title} ({formatCurrency(tx.amount)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Unrecognized charge or card issue"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description &bull; Details</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    style={{ height: "auto", padding: "10px 12px" }}
                    placeholder="Provide relevant dates, merchant names, or issue details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Ticket Details Modal */}
        {selectedTicket && (
          <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="ticket-card__ref">{selectedTicket.id || selectedTicket.ticketId}</span>
                  <h3 className="modal-title" style={{ marginTop: "6px" }}>
                    {selectedTicket.subject}
                  </h3>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                  &times;
                </button>
              </div>

              <div style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
                <span className={`ticket-card__status ticket-card__status--${(selectedTicket.status || "Open").replace(" ", "_")}`}>
                  {selectedTicket.status || "Open"}
                </span>
                <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                  Category: {selectedTicket.category}
                </span>
              </div>

              {selectedTicket.transactionReference && (
                <div style={{ padding: "8px 12px", backgroundColor: "#EFF6FF", borderRadius: "6px", marginBottom: "16px", fontSize: "0.82rem", color: "#1E40AF" }}>
                  Referenced Transaction: <strong>{selectedTicket.transactionReference}</strong>
                </div>
              )}

              <div style={{ fontSize: "0.9rem", color: "var(--navy-800)", lineHeight: "1.6", marginBottom: "24px" }}>
                <p><strong>Description:</strong></p>
                <p style={{ marginTop: "4px", color: "var(--navy-600)" }}>{selectedTicket.description}</p>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "14px", fontSize: "0.8rem", color: "#94A3B8" }}>
                Submitted on: {new Date(selectedTicket.createdAt || Date.now()).toLocaleString()}
              </div>

              <div className="modal-footer" style={{ marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedTicket(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default SupportTicketsPage;
