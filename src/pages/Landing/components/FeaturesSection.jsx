import React from "react";

/**
 * FeaturesSection Component ("Why Choose NexBank")
 * 
 * Clean light section showcasing the core banking feature cards:
 * 1. Smart Banking
 * 2. Secure & Safe
 * 3. Instant Transfers
 * 4. Bill Payments
 */
export function FeaturesSection() {
  const features = [
    {
      id: "smart-banking",
      title: "Smart Banking",
      description: "AI-powered insights to help you make smarter financial decisions.",
      badgeColor: "blue",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
          <path d="M9 17h6" />
        </svg>
      )
    },
    {
      id: "secure-safe",
      title: "Secure & Safe",
      description: "Bank-grade security with biometric authentication and encryption.",
      badgeColor: "emerald",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="3" />
        </svg>
      )
    },
    {
      id: "instant-transfers",
      title: "Instant Transfers",
      description: "Send and receive money instantly, 24/7, anywhere in the world.",
      badgeColor: "amber",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    },
    {
      id: "bill-payments",
      title: "Bill Payments",
      description: "Pay all your bills, recharge, and manage automatic payments.",
      badgeColor: "rose",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
      )
    }
  ];

  return (
    <section className="features-section" id="features">
      <div className="features-section__container">
        
        {/* Section Header */}
        <div className="section-header">
          <span className="section-header__eyebrow">WHY CHOOSE NEXBANK</span>
          <h2 className="section-header__title">
            Everything You Need, All in One Place
          </h2>
          <p className="section-header__description">
            From everyday banking to wealth management, we provide comprehensive solutions designed for your success.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="features-grid">
          {features.map((item) => (
            <div key={item.id} className="feature-card">
              <div className={`feature-card__icon-badge feature-card__icon-badge--${item.badgeColor}`}>
                {item.icon}
              </div>
              <h3 className="feature-card__title">{item.title}</h3>
              <p className="feature-card__desc">{item.description}</p>
              
              <div className="feature-card__footer">
                <span className="feature-card__learn-more">
                  Learn more
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default FeaturesSection;
