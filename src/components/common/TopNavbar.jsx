import React, { useState, useEffect } from "react";
import BrandLogo from "./BrandLogo";
import NotificationDrawer from "./NotificationDrawer";
import { fetchNotifications } from "../../services/notificationService";
import "./TopNavbar.css";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    id: "budgets",
    label: "Budgets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    )
  },
  {
    id: "savings",
    label: "Goals",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  },
  {
    id: "cards",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
  {
    id: "statements",
    label: "Statements",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
  {
    id: "support-tickets",
    label: "Support",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
    )
  }
];

/**
 * TopNavbar Component
 * 
 * Provides consistent top-level navigation, notification preview, user profile trigger, and logout
 */
export function TopNavbar({ user, activePage = "dashboard", onNavigate, onLogout }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.name || "Customer";
  const userInitials = user?.avatar || userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "NB";

  const refreshNotifications = () => {
    fetchNotifications()
      .then((res) => {
        if (typeof res?.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch((err) => console.warn("Notifications count fetch error:", err));
  };

  useEffect(() => {
    refreshNotifications();
  }, [isDrawerOpen]);

  const handleNavClick = (pageId) => {
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  return (
    <>
      <header className="nex-navbar">
        <div className="nex-navbar__container">
          
          {/* Left: Brand Identity */}
          <div className="nex-navbar__brand" onClick={() => handleNavClick("dashboard")}>
            <BrandLogo size="default" />
          </div>

          {/* Center: Navigation Links (Desktop/Tablet) */}
          <nav className="nex-navbar__nav" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nex-nav-link ${isActive ? "nex-nav-link--active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: User Profile & Actions */}
          <div className="nex-navbar__actions">
            
            {/* Notification Bell Button */}
            <button
              type="button"
              className="nex-icon-btn"
              aria-label="View notifications"
              title={`${unreadCount} notification${unreadCount === 1 ? "" : "s"}`}
              onClick={() => setIsDrawerOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="19" height="19">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="nex-notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div
              className={`nex-user-pill ${activePage === "profile" ? "nex-user-pill--active" : ""}`}
              onClick={() => handleNavClick("profile")}
              title="Click to view profile"
            >
              <div className="nex-user-avatar">{userInitials}</div>
              <div className="nex-user-info">
                <span className="nex-user-name">{userName}</span>
                <span className="nex-user-role">{user?.accountType || "Premier Member"}</span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              className="nex-logout-btn"
              onClick={onLogout}
              title="Sign out of your session"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="nex-logout-text">Sign Out</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="nex-hamburger-btn"
              aria-label="Toggle navigation menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                {isMobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="nex-mobile-menu">
            <div className="nex-mobile-menu__links">
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nex-mobile-link ${isActive ? "nex-mobile-link--active" : ""}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className={`nex-mobile-link ${activePage === "profile" ? "nex-mobile-link--active" : ""}`}
                onClick={() => handleNavClick("profile")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile &amp; Settings</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Notification Drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          refreshNotifications();
        }}
      />
    </>
  );
}

export default TopNavbar;
