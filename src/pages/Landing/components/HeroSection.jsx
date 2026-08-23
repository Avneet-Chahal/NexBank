import React from "react";
import HeroVisual3D from "./HeroVisual3D";

/**
 * HeroSection Component
 * 
 * Large premium hero section featuring:
 * - Trust badge pill ("✓ Trusted by 1M+ Customers")
 * - High-impact typography with "Tomorrow" gradient accent
 * - Direct action CTAs ("Sign In →" and "Create Account")
 * - 4 Value indicator highlights
 * - 3D Banking Showcase Visual
 * 
 * @param {object} props
 * @param {function} props.onNavigate - Page navigation callback
 */
export function HeroSection({ onNavigate }) {
  return (
    <section className="hero-section" id="home">
      <div className="hero-section__container">
        
        {/* Left Column: Hero Content & CTAs */}
        <div className="hero-content">
          
          {/* Trust Badge */}
          <div className="hero-badge">
            <span className="hero-badge__icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="hero-badge__text">Trusted by 1M+ Customers</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-headline">
            Banking for a<br />
            Better <span className="hero-headline__highlight">Tomorrow</span>
          </h1>

          {/* Supporting Text */}
          <p className="hero-description">
            Experience the future of digital banking with NexBank. Smart, secure, and simple banking that fits your life.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="hero-cta-group">
            <button
              type="button"
              id="hero-signin-btn"
              className="hero-btn hero-btn--primary"
              onClick={() => onNavigate && onNavigate("signin")}
            >
              <span>Sign In</span>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" className="hero-btn__arrow">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              type="button"
              id="hero-register-btn"
              className="hero-btn hero-btn--secondary"
              onClick={() => onNavigate && onNavigate("register")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>Create Account</span>
            </button>
          </div>

          {/* 4 Compact Trust / Value Indicators */}
          <div className="hero-trust-indicators">
            
            {/* Indicator 1 */}
            <div className="trust-indicator-item">
              <div className="trust-indicator-item__icon trust-indicator-item__icon--security">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="trust-indicator-item__text">
                <span className="trust-indicator-item__title">Bank Grade Security</span>
                <span className="trust-indicator-item__subtitle">256-bit Encryption</span>
              </div>
            </div>

            {/* Indicator 2 */}
            <div className="trust-indicator-item">
              <div className="trust-indicator-item__icon trust-indicator-item__icon--speed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="trust-indicator-item__text">
                <span className="trust-indicator-item__title">Instant Transactions</span>
                <span className="trust-indicator-item__subtitle">In Real-time</span>
              </div>
            </div>

            {/* Indicator 3 */}
            <div className="trust-indicator-item">
              <div className="trust-indicator-item__icon trust-indicator-item__icon--support">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M3 18v-6a9 9 0 0118 0v6" />
                  <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
                </svg>
              </div>
              <div className="trust-indicator-item__text">
                <span className="trust-indicator-item__title">24/7 Support</span>
                <span className="trust-indicator-item__subtitle">We are here</span>
              </div>
            </div>

            {/* Indicator 4 */}
            <div className="trust-indicator-item">
              <div className="trust-indicator-item__icon trust-indicator-item__icon--privacy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div className="trust-indicator-item__text">
                <span className="trust-indicator-item__title">Your Privacy</span>
                <span className="trust-indicator-item__subtitle">Our Priority</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: 3D Composition */}
        <div className="hero-showcase">
          <HeroVisual3D />
        </div>

      </div>
    </section>
  );
}

export default HeroSection;
