import React, { useState, useEffect } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import { fetchCard, updateCardSettings, getDemoCardActivity } from "../../services/cardService";
import { formatCurrency } from "../../services/dashboardService";
import "./Cards.css";

export function CardsPage({ user, onNavigate, onLogout }) {
  const [card, setCard] = useState(null);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [recentActivities] = useState(() => getDemoCardActivity());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    setIsLoading(true);
    try {
      const res = await fetchCard();
      setCard(res.card);
      setDataSource(res.source);
    } catch (err) {
      console.error("Failed to load virtual card:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!card) return;
    setIsUpdating(true);
    const newFrozen = !card.isFrozen;
    try {
      const updated = await updateCardSettings({ isFrozen: newFrozen });
      setCard(updated);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateLimit = async (newLimit) => {
    if (!card) return;
    const num = Number(newLimit);
    if (num <= 0) return;
    try {
      const updated = await updateCardSettings({ monthlyLimit: num });
      setCard(updated);
    } catch (err) {
      console.error("Failed to update limit:", err);
    }
  };

  const handleToggleSetting = async (key) => {
    if (!card) return;
    try {
      const updated = await updateCardSettings({ [key]: !card[key] });
      setCard(updated);
    } catch (err) {
      console.error("Failed to update card setting:", err);
    }
  };

  const maskedNumber = card?.cardNumber
    ? showDetails
      ? card.cardNumber
      : `•••• •••• •••• ${card.cardNumber.slice(-4)}`
    : "•••• •••• •••• 9104";

  const maskedCvv = showDetails ? (card?.cvv || "842") : "•••";

  return (
    <div className="cards-layout">
      <TopNavbar
        user={user}
        activePage="cards"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="cards-main">
        {/* Header */}
        <div className="cards-header">
          <div>
            <h1 className="cards-header__title">Virtual Debit Card</h1>
            <p className="cards-header__subtitle">
              Manage instant virtual card security, adjust simulated limits, and control point-of-sale features.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <DataSourceBadge source={dataSource} />
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div
          style={{
            backgroundColor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "28px",
            fontSize: "0.82rem",
            color: "#1E40AF",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>
            <strong>Academic Portfolio Simulation:</strong> Demo virtual card for demonstration of security freezing, masking, and spending controls. No real debit card exists or connects to external card networks.
          </span>
        </div>

        {isLoading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <h2>Loading card details &amp; security state...</h2>
          </div>
        ) : (
          <div className="cards-content-grid">
            {/* Left: 3D Virtual Card Display & Card Activity */}
            <div className="card-display-section">
              {/* Card Container */}
              <div className="premium-card-stage">
                <div className={`premium-card ${card?.isFrozen ? "premium-card--frozen" : ""}`}>
                  <div className="card-ambient-glow" />

                  {card?.isFrozen && (
                    <div className="card-frozen-ribbon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      <span>CARD FROZEN</span>
                    </div>
                  )}

                  {/* Top row */}
                  <div className="card-top-row">
                    <div className="card-emv-chip" />
                    <span className="card-brand-badge">NexBank</span>
                  </div>

                  {/* Number row */}
                  <div className="card-number-row">
                    <span className="card-number-text">{maskedNumber}</span>
                    <button
                      type="button"
                      className="card-eye-btn"
                      onClick={() => setShowDetails(!showDetails)}
                      title={showDetails ? "Hide card details" : "Reveal card details"}
                    >
                      {showDetails ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Bottom row */}
                  <div className="card-bottom-row">
                    <div>
                      <span className="card-meta-label">Cardholder</span>
                      <span className="card-holder-name">{user?.name || card?.cardHolder || "Demo Customer"}</span>
                    </div>

                    <div style={{ display: "flex", gap: "24px" }}>
                      <div>
                        <span className="card-meta-label">Expires</span>
                        <span className="card-meta-val">{card?.expiryDate || "08/29"}</span>
                      </div>
                      <div>
                        <span className="card-meta-label">CVV</span>
                        <span className="card-meta-val">{maskedCvv}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance & Mask Toggle Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  backgroundColor: "var(--white)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--navy-200)"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#64748B", display: "block" }}>
                    Primary Account Balance
                  </span>
                  <strong style={{ fontSize: "1.1rem", color: "var(--navy-900)" }}>
                    {showBalance ? formatCurrency(user?.balance || 84250.75) : "••••••••"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="budget-card-btn"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? "Hide Balance" : "Show Balance"}
                </button>
              </div>

              {/* Recent Card Transactions */}
              <div className="card-activity-card">
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--navy-900)", marginBottom: "14px" }}>
                  Recent Card POS Authorizations
                </h3>
                {recentActivities.map((act) => (
                  <div key={act.id} className="activity-item-card">
                    <div>
                      <h4 style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--navy-900)" }}>
                        {act.merchant}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {act.date} &bull; {act.channel}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: "700", color: "var(--navy-900)", fontSize: "0.9rem" }}>
                        -{formatCurrency(act.amount)}
                      </span>
                      <span style={{ display: "block", fontSize: "0.72rem", color: "#10B981", fontWeight: "600" }}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Security & Usage Controls */}
            <div className="card-controls-card">
              <div>
                <h3 className="control-group-header">Instant Security Controls</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--navy-500)" }}>
                  Toggle card authorizations and adjust simulated spending parameters in real-time.
                </p>
              </div>

              {/* Freeze Card Control */}
              <div className="control-toggle-row">
                <div className="control-toggle-info">
                  <h4>Lock / Freeze Virtual Card</h4>
                  <p>Instantly block all incoming and POS authorization attempts.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={card?.isFrozen || false}
                    onChange={handleToggleFreeze}
                    disabled={isUpdating}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Simulated Spending Limit Slider */}
              <div className="limit-control-box">
                <div className="limit-display-row">
                  <div>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--navy-900)" }}>
                      Monthly Spending Limit
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "var(--navy-500)" }}>
                      Current active threshold
                    </span>
                  </div>
                  <span className="limit-current-val">
                    {formatCurrency(card?.monthlyLimit || 50000)}
                  </span>
                </div>

                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  className="limit-slider-range"
                  value={card?.monthlyLimit || 50000}
                  onChange={(e) => handleUpdateLimit(e.target.value)}
                />

                <div className="limit-presets-row">
                  {[25000, 50000, 100000, 150000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="limit-preset-btn"
                      onClick={() => handleUpdateLimit(preset)}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contactless NFC Toggle */}
              <div className="control-toggle-row">
                <div className="control-toggle-info">
                  <h4>Contactless &amp; NFC Tap-to-Pay</h4>
                  <p>Allow touch-free POS checkouts on mobile and smart terminals.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={card?.contactlessEnabled ?? true}
                    onChange={() => handleToggleSetting("contactlessEnabled")}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Online Transactions Toggle */}
              <div className="control-toggle-row">
                <div className="control-toggle-info">
                  <h4>Online E-Commerce Transactions</h4>
                  <p>Authorize internet merchant checkouts (Amazon, Netflix, etc.).</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={card?.onlineTransactionsEnabled ?? true}
                    onChange={() => handleToggleSetting("onlineTransactionsEnabled")}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* International Spending Toggle */}
              <div className="control-toggle-row" style={{ borderBottom: "none" }}>
                <div className="control-toggle-info">
                  <h4>International Currency Clearance</h4>
                  <p>Enable cross-border foreign currency merchant checkouts.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={card?.internationalEnabled ?? false}
                    onChange={() => handleToggleSetting("internationalEnabled")}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CardsPage;
