import React from "react";
import BrandLogo from "./BrandLogo";
import "./TopNavbar.css";

/**
 * TopNavbar Component
 * 
 * Provides consistent top-level navigation, notification preview, user profile trigger, and logout
 * 
 * @param {object} props
 * @param {object} props.user - Current logged in user
 * @param {string} props.activePage - Currently active page identifier ('dashboard' | 'profile')
 * @param {function} props.onNavigate - Page navigation callback
 * @param {function} props.onLogout - Logout action callback
 */
export function TopNavbar({ user, activePage = "dashboard", onNavigate, onLogout }) {
  const userName = user?.name || "Customer";
  const userInitials = user?.avatar || userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "NB";

  return (
    <header className="nex-navbar">
      <div className="nex-navbar__container">
        
        {/* Left: Brand Identity */}
        <div className="nex-navbar__brand" onClick={() => onNavigate && onNavigate("dashboard")}>
          <BrandLogo size="default" />
        </div>

        {/* Center: Navigation Links */}
        <nav className="nex-navbar__nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nex-nav-link ${activePage === "dashboard" ? "nex-nav-link--active" : ""}`}
            onClick={() => onNavigate && onNavigate("dashboard")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nex-nav-link ${activePage === "profile" ? "nex-nav-link--active" : ""}`}
            onClick={() => onNavigate && onNavigate("profile")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="nex-navbar__actions">
          
          {/* Notification Button */}
          <button
            type="button"
            className="nex-icon-btn"
            aria-label="View notifications"
            title="3 new security notices"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="nex-notification-dot" />
          </button>

          {/* User Profile Pill */}
          <div
            className="nex-user-pill"
            onClick={() => onNavigate && onNavigate("profile")}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="nex-logout-text">Sign Out</span>
          </button>

        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
