import React, { useState, useEffect } from "react";
import BrandLogo from "./BrandLogo";

/**
 * PublicNavbar Component
 * 
 * Reusable navigation bar for the 5 PUBLIC website pages:
 * 1. Home
 * 2. Features
 * 3. Security
 * 4. About Us
 * 5. Support
 * 
 * Includes:
 * - Left: NexBank brand logo + Enterprise Digital Banking tagline
 * - Center: Home | Features | Security | About Us | Support
 * - Right: Customer Login (navigates to Sign In page)
 * - Highlights the active public page (activePage)
 * - Mobile responsive drawer menu
 * 
 * @param {object} props
 * @param {'home' | 'features' | 'security' | 'about' | 'support'} props.activePage - Currently active public page
 * @param {function} props.onNavigate - Navigation callback
 */
export function PublicNavbar({ activePage = "home", onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitor scroll offset for subtle background elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (pageId) => {
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  return (
    <header className={`landing-nav ${isScrolled ? "landing-nav--scrolled" : ""}`}>
      <div className="landing-nav__container">
        
        {/* Left: Brand Logo & Enterprise Identity */}
        <div 
          className="landing-nav__brand"
          onClick={() => handleNavClick("home")}
          role="button"
          tabIndex={0}
          aria-label="NexBank Home"
        >
          <BrandLogo size="default" light showTagline />
        </div>

        {/* Center: Desktop Navigation Links (5 Public Pages) */}
        <nav className="landing-nav__links" aria-label="Public Website Navigation">
          <button
            type="button"
            className={`landing-nav__link ${activePage === "home" ? "landing-nav__link--active" : ""}`}
            onClick={() => handleNavClick("home")}
            aria-current={activePage === "home" ? "page" : undefined}
          >
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`landing-nav__link ${activePage === "features" ? "landing-nav__link--active" : ""}`}
            onClick={() => handleNavClick("features")}
            aria-current={activePage === "features" ? "page" : undefined}
          >
            <span>Features</span>
          </button>

          <button
            type="button"
            className={`landing-nav__link ${activePage === "security" ? "landing-nav__link--active" : ""}`}
            onClick={() => handleNavClick("security")}
            aria-current={activePage === "security" ? "page" : undefined}
          >
            <span>Security</span>
          </button>

          <button
            type="button"
            className={`landing-nav__link ${activePage === "about" ? "landing-nav__link--active" : ""}`}
            onClick={() => handleNavClick("about")}
            aria-current={activePage === "about" ? "page" : undefined}
          >
            <span>About Us</span>
          </button>

          <button
            type="button"
            className={`landing-nav__link ${activePage === "support" ? "landing-nav__link--active" : ""}`}
            onClick={() => handleNavClick("support")}
            aria-current={activePage === "support" ? "page" : undefined}
          >
            <span>Support</span>
          </button>
        </nav>

        {/* Right: Customer Login Action */}
        <div className="landing-nav__actions">
          <button
            type="button"
            id="public-customer-login-btn"
            className="landing-nav__login-btn"
            onClick={() => onNavigate && onNavigate("signin")}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              width="16" 
              height="16"
              className="landing-nav__login-icon"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Customer Login</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="landing-nav__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="landing-nav__mobile-drawer">
          <div className="landing-nav__mobile-links">
            <button
              type="button"
              className={`landing-nav__mobile-link ${activePage === "home" ? "landing-nav__mobile-link--active" : ""}`}
              onClick={() => handleNavClick("home")}
              aria-current={activePage === "home" ? "page" : undefined}
            >
              Home
            </button>
            <button
              type="button"
              className={`landing-nav__mobile-link ${activePage === "features" ? "landing-nav__mobile-link--active" : ""}`}
              onClick={() => handleNavClick("features")}
              aria-current={activePage === "features" ? "page" : undefined}
            >
              Features
            </button>
            <button
              type="button"
              className={`landing-nav__mobile-link ${activePage === "security" ? "landing-nav__mobile-link--active" : ""}`}
              onClick={() => handleNavClick("security")}
              aria-current={activePage === "security" ? "page" : undefined}
            >
              Security
            </button>
            <button
              type="button"
              className={`landing-nav__mobile-link ${activePage === "about" ? "landing-nav__mobile-link--active" : ""}`}
              onClick={() => handleNavClick("about")}
              aria-current={activePage === "about" ? "page" : undefined}
            >
              About Us
            </button>
            <button
              type="button"
              className={`landing-nav__mobile-link ${activePage === "support" ? "landing-nav__mobile-link--active" : ""}`}
              onClick={() => handleNavClick("support")}
              aria-current={activePage === "support" ? "page" : undefined}
            >
              Support
            </button>
          </div>

          <div className="landing-nav__mobile-actions">
            <button
              type="button"
              className="landing-nav__mobile-login-btn"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate && onNavigate("signin");
              }}
            >
              Customer Login
            </button>

            <button
              type="button"
              className="landing-nav__mobile-register-btn"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate && onNavigate("register");
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
