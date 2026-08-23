import React from "react";
import BrandLogo from "../../../components/common/BrandLogo";

/**
 * LandingFooter Component
 * 
 * Corporate footer for NexBank with:
 * - Brand emblem and enterprise description
 * - Company navigation links (About Us, Security, Support)
 * - Legal policies (Privacy Policy, Terms & Conditions)
 * - Formal copyright notice
 */
export function LandingFooter() {
  const scrollToSection = (sectionId) => {
    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      const headerOffset = 80;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <footer className="landing-footer" id="about">
      <div className="landing-footer__container">
        
        {/* Top Footer Row */}
        <div className="landing-footer__grid">
          
          {/* Left Column: Brand & Tagline */}
          <div className="landing-footer__brand-col">
            <div 
              className="landing-footer__logo-wrap"
              onClick={() => scrollToSection("home")}
              role="button"
              tabIndex={0}
            >
              <BrandLogo size="default" light showTagline />
            </div>
            <p className="landing-footer__desc">
              Secure, intelligent and simple digital banking for modern customers. Built with next-generation financial technology and multi-layer enterprise protection.
            </p>
            <div className="landing-footer__security-badge">
              <span className="landing-footer__badge-dot" />
              <span>NexBank Core Banking System v1.0.0</span>
            </div>
          </div>

          {/* Right Column: Links */}
          <div className="landing-footer__links-grid">
            
            {/* Company Links */}
            <div className="landing-footer__link-group" id="support">
              <h4 className="landing-footer__group-title">Company</h4>
              <ul className="landing-footer__link-list">
                <li>
                  <button 
                    type="button" 
                    className="landing-footer__link"
                    onClick={() => scrollToSection("home")}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className="landing-footer__link"
                    onClick={() => scrollToSection("features")}
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className="landing-footer__link"
                    onClick={() => scrollToSection("security")}
                  >
                    Security
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className="landing-footer__link"
                    onClick={() => scrollToSection("about")}
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    className="landing-footer__link"
                    onClick={() => scrollToSection("support")}
                  >
                    Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="landing-footer__link-group">
              <h4 className="landing-footer__group-title">Legal</h4>
              <ul className="landing-footer__link-list">
                <li>
                  <span className="landing-footer__text-link">Privacy Policy</span>
                </li>
                <li>
                  <span className="landing-footer__text-link">Terms & Conditions</span>
                </li>
                <li>
                  <span className="landing-footer__text-link">Security Disclosures</span>
                </li>
                <li>
                  <span className="landing-footer__text-link">Cookie Preferences</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="landing-footer__bottom">
          <p className="landing-footer__copyright">
            &copy; 2026 NexBank. All rights reserved.
          </p>
          <div className="landing-footer__encryption-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>256-Bit SSL Encrypted Banking Network</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default LandingFooter;
