import React, { useState, useEffect } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import DataSourceBadge from "../Dashboard/components/DataSourceBadge";
import { fetchCard, updateCardSettings, getDemoCardActivity } from "../../services/cardService";
import { formatCurrency, getAuthoritativeBalance } from "../../services/dashboardService";
import "./Cards.css";

export function CardsPage({ user, onNavigate, onLogout }) {
  const [card, setCard] = useState(null);
  const [dataSource, setDataSource] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [recentActivities] = useState(() => getDemoCardActivity());
  const [isUpdating, setIsUpdating] = useState(false);
  const [accountBalance, setAccountBalance] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(null);

  useEffect(() => {
    loadCard();
    loadBalance();

    const handleTxUpdate = () => {
      loadBalance();
    };

    window.addEventListener("nexbank_transaction_updated", handleTxUpdate);
    return () => {
      window.removeEventListener("nexbank_transaction_updated", handleTxUpdate);
    };
  }, [user]);

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

  const loadBalance = async () => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      const base = user?.balance !== undefined ? user.balance : 84250.75;
      const res = await getAuthoritativeBalance(base);
      setAccountBalance(res.availableBalance);
    } catch (err) {
      console.error("Failed to load authoritative account balance:", err);
      setBalanceError("Unable to retrieve balance");
    } finally {
      setIsBalanceLoading(false);
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

          <div className="cards-header__actions">
            <DataSourceBadge source={dataSource} />
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div className="cards-academic-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="academic-notice-icon">
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
                    <div className="card-top-right">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="card-contactless-icon" aria-label="Contactless payment ready">
                        <path d="M8.5 16.5a5 5 0 0 1 0-7" strokeLinecap="round" />
                        <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
                        <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
                      </svg>
                      <span className="card-brand-badge">NexBank</span>
                    </div>
                  </div>

                  {/* Number row */}
                  <div className="card-number-row">
                    <span className="card-number-text">{maskedNumber}</span>
                    <button
                      type="button"
                      className="card-eye-btn"
                      onClick={() => setShowDetails(!showDetails)}
                      title={showDetails ? "Hide card details" : "Reveal card details"}
                      aria-label={showDetails ? "Hide card details" : "Reveal card details"}
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

                    <div className="card-meta-group">
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
              <div className="card-balance-strip">
                <div>
                  <span className="card-balance-label">
                    Primary Account Balance
                  </span>
                  <strong className="card-balance-value">
                    {isBalanceLoading ? (
                      <span className="card-balance-loading">Loading balance...</span>
                    ) : balanceError ? (
                      <span className="card-balance-error">
                        {balanceError}{" "}
                        <button
                          type="button"
                          className="card-balance-retry-btn"
                          onClick={loadBalance}
                          title="Retry retrieving authoritative balance"
                        >
                          Retry
                        </button>
                      </span>
                    ) : showBalance ? (
                      formatCurrency(accountBalance !== null ? accountBalance : (user?.balance || 84250.75))
                    ) : (
                      "••••••••"
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className="card-toggle-balance-btn"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? "Hide Balance" : "Show Balance"}
                </button>
              </div>

              {/* Recent Card Transactions */}
              <div className="card-activity-card">
                <div className="card-activity-header">
                  <h3 className="card-activity-title">
                    Recent Card POS Authorizations
                  </h3>
                  <span className="card-activity-badge">{recentActivities.length} recent</span>
                </div>
                {recentActivities.map((act) => (
                  <div key={act.id} className="activity-item-card">
                    <div className="activity-item-left">
                      <div className="activity-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="activity-merchant">{act.merchant}</h4>
                        <span className="activity-meta">
                          {act.date} &bull; {act.channel}
                        </span>
                      </div>
                    </div>
                    <div className="activity-item-right">
                      <span className="activity-amount">
                        -{formatCurrency(act.amount)}
                      </span>
                      <span className="activity-status">
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Security & Usage Controls */}
            <div className="card-controls-card">
              <div className="control-card-header">
                <h3 className="control-group-header">Instant Security Controls</h3>
                <p className="control-group-desc">
                  Toggle card authorizations and adjust simulated spending parameters in real-time.
                </p>
              </div>

              {/* Freeze Card Control */}
              <div className="control-toggle-row">
                <div className="control-toggle-info">
                  <h4>Lock / Freeze Virtual Card</h4>
                  <p>Instantly block all incoming and POS authorization attempts.</p>
                </div>
                <label className="switch" aria-label="Toggle lock or freeze virtual card">
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
                    <h4 className="limit-title">Monthly Spending Limit</h4>
                    <span className="limit-subtitle">Current active threshold</span>
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
                  aria-label="Adjust monthly spending limit"
                />

                <div className="limit-presets-row">
                  {[25000, 50000, 100000, 150000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`limit-preset-btn ${card?.monthlyLimit === preset ? "limit-preset-btn--active" : ""}`}
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
              <div className="control-toggle-row control-toggle-row--last">
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
