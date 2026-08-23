import React from "react";

/**
 * AboutSection Component ("About Us")
 * 
 * Enterprise digital banking background, institutional statistics, and core values:
 * - 1M+ Active Customers
 * - ₹500Cr+ Monthly Volume
 * - 99.99% Uptime Guarantee
 * - 24/7 Global Infrastructure
 */
export function AboutSection() {
  const stats = [
    {
      id: "users",
      value: "1M+",
      label: "Active Customers",
      detail: "Across personal & business accounts"
    },
    {
      id: "volume",
      value: "₹500Cr+",
      label: "Monthly Volume",
      detail: "Processed securely in real-time"
    },
    {
      id: "uptime",
      value: "99.99%",
      label: "System Uptime",
      detail: "Reliable cloud infrastructure"
    },
    {
      id: "rating",
      value: "4.9 / 5",
      label: "Customer Rating",
      detail: "Rated by verified users"
    }
  ];

  return (
    <section className="about-section" id="about">
      <div className="about-section__container">
        
        {/* Header */}
        <div className="section-header">
          <span className="section-header__eyebrow">ABOUT NEXBANK</span>
          <h2 className="section-header__title">
            Pioneering the Next Era of Digital Banking
          </h2>
          <p className="section-header__description">
            Founded with the vision to make banking seamless, transparent, and ultra-secure. We blend advanced financial technology with human-centric design to deliver an unmatched digital banking experience.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="about-stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="about-stat-card">
              <span className="about-stat-card__value">{stat.value}</span>
              <span className="about-stat-card__label">{stat.label}</span>
              <span className="about-stat-card__detail">{stat.detail}</span>
            </div>
          ))}
        </div>

        {/* Pillars Banner */}
        <div className="about-pillars-card">
          <div className="about-pillar-item">
            <div className="about-pillar-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h3 className="about-pillar-item__title">Technology First</h3>
              <p className="about-pillar-item__desc">Modern cloud-native core banking architecture designed for zero latency and continuous resilience.</p>
            </div>
          </div>

          <div className="about-pillar-item">
            <div className="about-pillar-item__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="about-pillar-item__title">Customer Centric</h3>
              <p className="about-pillar-item__desc">Every feature, transfer flow, and security measure is engineered around customer clarity and convenience.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default AboutSection;
