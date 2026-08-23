import React from "react";

/**
 * SecuritySection Component ("Your Money. Your Security. Our Priority.")
 * 
 * Dark-navy visual panel with glowing security highlights:
 * - 256-bit Encryption
 * - Multi-Factor Authentication
 * - Real-Time Fraud Monitoring
 * - Enterprise security certification badges
 */
export function SecuritySection() {
  const securityPoints = [
    {
      id: "sec-enc",
      title: "256-bit Encryption",
      description: "Protected financial data and secure communication across all banking channels.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )
    },
    {
      id: "sec-mfa",
      title: "Multi-Factor Authentication",
      description: "Additional biometric and time-based OTP protection for every transaction.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      id: "sec-fraud",
      title: "Real-Time Fraud Monitoring",
      description: "Continuous automated heuristic monitoring for anomalous and suspicious activity.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ];

  return (
    <section className="security-section" id="security">
      <div className="security-section__container">
        
        {/* Main Dark Visual Panel */}
        <div className="security-panel">
          <div className="security-panel__ambient" />
          
          {/* Header */}
          <div className="security-panel__header">
            <div className="security-panel__badge">
              <span className="security-panel__badge-dot" />
              <span>NEXSHIELD™ CORE SECURITY</span>
            </div>
            <h2 className="security-panel__title">
              Your Money. Your Security. <span className="security-panel__highlight">Our Priority.</span>
            </h2>
            <p className="security-panel__subtitle">
              We employ military-grade security infrastructure so you can manage your wealth with peace of mind.
            </p>
          </div>

          {/* 3 Security Points Grid */}
          <div className="security-points-grid">
            {securityPoints.map((point) => (
              <div key={point.id} className="security-point-card">
                <div className="security-point-card__icon-box">
                  {point.icon}
                </div>
                <h3 className="security-point-card__title">{point.title}</h3>
                <p className="security-point-card__desc">{point.description}</p>
              </div>
            ))}
          </div>

          {/* Institutional Compliance Badges Bar */}
          <div className="security-panel__footer">
            <div className="compliance-badge">
              <span className="compliance-badge__dot" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge__dot" />
              <span>SOC-2 Type II Validated</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge__dot" />
              <span>PCI-DSS Level 1 Compliant</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge__dot" />
              <span>RBI Guidelines Aligned</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default SecuritySection;
