import React from "react";

/**
 * TrustStrip Component
 * 
 * Visually integrated horizontal trust bar at the base of the dark hero section.
 * Reassures customers of institution-level security, instant settlement, constant support, and privacy.
 */
export function TrustStrip() {
  const items = [
    {
      id: "sec",
      label: "Bank Grade Security",
      detail: "256-Bit SSL",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      id: "speed",
      label: "Instant Transactions",
      detail: "Sub-Second UPI",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    },
    {
      id: "support",
      label: "24/7 Support",
      detail: "Live Banking Desk",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M3 18v-6a9 9 0 0118 0v6" />
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
        </svg>
      )
    },
    {
      id: "priv",
      label: "Your Privacy",
      detail: "Zero Data Sharing",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )
    }
  ];

  return (
    <div className="trust-strip">
      <div className="trust-strip__container">
        {items.map((item) => (
          <div key={item.id} className="trust-strip__item">
            <div className="trust-strip__icon-wrap">
              {item.icon}
            </div>
            <div className="trust-strip__content">
              <span className="trust-strip__title">{item.label}</span>
              <span className="trust-strip__subtitle">{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustStrip;
