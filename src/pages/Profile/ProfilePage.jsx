import React, { useState, useEffect } from "react";
import TopNavbar from "../../components/common/TopNavbar";
import AlertBanner from "../../components/common/AlertBanner";
import { validateFullName, validateMobile, getPasswordRuleStatus } from "../../utils/validation";
import {
  updateStoredUserProfile,
  updateUserPassword,
  getUserPreferences,
  saveUserPreferences
} from "../../services/authService";
import { formatCurrency } from "../../services/dashboardService";
import "./Profile.css";

/**
 * NexBank – Customer Profile Page Component
 * 
 * @param {object} props
 * @param {object} props.user - Authenticated customer record
 * @param {function} props.onNavigate - Navigation callback
 * @param {function} props.onLogout - Logout action callback
 * @param {function} props.onUserUpdate - Callback to update global currentUser state
 */
export function ProfilePage({ user, onNavigate, onLogout, onUserUpdate }) {
  // Personal Info Edit State 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.name || "",
    mobile: user?.mobile || ""
  });
  const [editErrors, setEditErrors] = useState({});
  const [feedbackAlert, setFeedbackAlert] = useState({ type: null, message: "" });

  // Security & Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordAlert, setPasswordAlert] = useState({ type: null, message: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Preferences State with LocalStorage Persistence 
  const [preferences, setPreferences] = useState(() => getUserPreferences());

  // Synchronize editForm if user prop changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.name || "",
        mobile: user.mobile || ""
      });
    }
  }, [user]);

  // Fallback / Logged-in Customer Fields
  const {
    name = "Customer",
    email = "customer@nexbank.com",
    mobile = "9876543210",
    accountNumber = "NB8577145",
    accountType = "Savings Account",
    accountStatus = "Active",
    id: customerId = "NX-8801",
    balance = 84250.75,
    avatar,
    registrationDate,
    createdAt
  } = user || {};

  // Formatted Member Since Date
  const memberSinceDate = new Date(registrationDate || createdAt || "2024-01-15").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  // Avatar Initials (e.g. "A" or "AC")
  const displayAvatar = avatar || name.charAt(0).toUpperCase() || "N";

  /**
   * Handle Edit Mode Activation
   */
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditForm({
      fullName: name,
      mobile: mobile
    });
    setEditErrors({});
    setFeedbackAlert({ type: null, message: "" });
  };

  /**
   * Cancel Edit Mode
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: name,
      mobile: mobile
    });
    setEditErrors({});
  };

  /**
   * Handle Edit Input Changes
   */
  const handleEditInputChange = (event) => {
    const { name: fieldName, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [fieldName]: value
    }));

    if (editErrors[fieldName]) {
      setEditErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  /**
   * Save Profile Changes to LocalStorage and Parent State
   */
  const handleSaveProfile = (event) => {
    event.preventDefault();

    const nameValidation = validateFullName(editForm.fullName);
    const mobileValidation = validateMobile(editForm.mobile);

    const errors = {};
    if (!nameValidation.isValid) {
      errors.fullName = nameValidation.message;
    }
    if (!mobileValidation.isValid) {
      errors.mobile = mobileValidation.message;
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      setFeedbackAlert({
        type: "error",
        message: "Please correct the highlighted fields before saving."
      });
      return;
    }

    // Update in LocalStorage via authService
    const result = updateStoredUserProfile({
      name: editForm.fullName,
      mobile: editForm.mobile
    });

    if (result.success) {
      setIsEditing(false);
      setFeedbackAlert({
        type: "success",
        message: result.message
      });

      // Synchronize with global state so TopNavbar & Dashboard update instantly
      if (typeof onUserUpdate === "function") {
        onUserUpdate(result.user);
      }
    } else {
      setFeedbackAlert({
        type: "error",
        message: result.message
      });
    }
  };

  /**
   * Toggle Preference switch and persist to LocalStorage
   */
  const handleTogglePreference = (key) => {
    const updatedPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };

    setPreferences(updatedPreferences);
    saveUserPreferences(updatedPreferences);
  };

  /**
   * Handle Password Change Form Inputs
   */
  const handlePasswordInputChange = (event) => {
    const { name: fieldName, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [fieldName]: value
    }));

    if (passwordErrors[fieldName]) {
      setPasswordErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  /**
   * Handle Password Change Submission
   */
  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    setPasswordAlert({ type: null, message: "" });

    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    const pwdStatus = getPasswordRuleStatus(passwordForm.newPassword);
    if (!pwdStatus.isValid) {
      errors.newPassword = "New password must be at least 8 characters with letters and numbers.";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const result = updateUserPassword(email, passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success) {
      setPasswordAlert({ type: "success", message: result.message });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setShowChangePassword(false), 2000);
    } else {
      setPasswordAlert({ type: "error", message: result.message });
    }
  };

  return (
    <div className="profile-layout">
      {/* Top Navigation Bar */}
      <TopNavbar
        user={user}
        activePage="profile"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="profile-main">
        {/* Global Feedback Banner */}
        {feedbackAlert.message && (
          <AlertBanner
            type={feedbackAlert.type}
            message={feedbackAlert.message}
            onClose={() => setFeedbackAlert({ type: null, message: "" })}
          />
        )}

        {/* Profile Hero Section */}
        <section className="profile-hero">
          <div className="profile-hero__ambient" />

          <div className="profile-hero__left">
            <div className="profile-hero__avatar">
              {displayAvatar}
            </div>

            <div className="profile-hero__details">
              <h1 className="profile-hero__name">{name}</h1>
              <div className="profile-hero__badges">
                <span className="hero-role-badge">Customer Account</span>
                <span className="hero-status-badge">
                  <span className="status-dot" />
                  Account Status: {accountStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-hero__right">
            <span className="profile-hero__member-since">Member Since {memberSinceDate}</span>
            <span className="profile-hero__account-pill">{accountNumber}</span>
          </div>
        </section>

        {/* 2-Column Main Content Grid */}
        <div className="profile-grid">
          
          {/* Left Column: Personal Information & Account Details */}
          <div className="profile-column">
            
            {/* 1. Personal Information Card */}
            <div className="profile-card">
              <div className="profile-card__header">
                <h2 className="profile-card__title">
                  <svg className="profile-card__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Personal Information
                </h2>

                {!isEditing && (
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={handleStartEdit}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Editable Form Mode */
                <form onSubmit={handleSaveProfile} noValidate>
                  <div className="info-fields-list">
                    
                    {/* Full Name Input */}
                    <div className="info-field-row">
                      <label htmlFor="profile-fullname-input" className="info-field-label">
                        Full Legal Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        id="profile-fullname-input"
                        name="fullName"
                        type="text"
                        className={`form-input ${editErrors.fullName ? "form-input--error" : ""}`}
                        value={editForm.fullName}
                        onChange={handleEditInputChange}
                        placeholder="Enter full legal name"
                      />
                      {editErrors.fullName && (
                        <span className="form-error-msg">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {editErrors.fullName}
                        </span>
                      )}
                    </div>

                    {/* Email (Read-Only) */}
                    <div className="info-field-row">
                      <label className="info-field-label">
                        Email Address (Read-Only)
                      </label>
                      <div className="info-field-value info-field-value--readonly">
                        <span>{email}</span>
                        <span className="lock-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          Protected
                        </span>
                      </div>
                    </div>

                    {/* Mobile Phone Input */}
                    <div className="info-field-row">
                      <label htmlFor="profile-mobile-input" className="info-field-label">
                        Mobile Phone Number <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        id="profile-mobile-input"
                        name="mobile"
                        type="tel"
                        className={`form-input ${editErrors.mobile ? "form-input--error" : ""}`}
                        value={editForm.mobile}
                        onChange={handleEditInputChange}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {editErrors.mobile && (
                        <span className="form-error-msg">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {editErrors.mobile}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="profile-edit-actions">
                      <button
                        type="submit"
                        className="profile-save-btn"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Save Changes</span>
                      </button>

                      <button
                        type="button"
                        className="profile-cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                </form>
              ) : (
                /* Read-Only Display Mode */
                <div className="info-fields-list">
                  <div className="info-field-row">
                    <span className="info-field-label">Full Legal Name</span>
                    <div className="info-field-value">{name}</div>
                  </div>

                  <div className="info-field-row">
                    <span className="info-field-label">Email Address</span>
                    <div className="info-field-value info-field-value--readonly">
                      <span>{email}</span>
                      <span className="lock-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="info-field-row">
                    <span className="info-field-label">Mobile Phone Number</span>
                    <div className="info-field-value">{mobile || "Not specified"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Account Information Card */}
            <div className="profile-card">
              <div className="profile-card__header">
                <h2 className="profile-card__title">
                  <svg className="profile-card__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Account Information
                </h2>
              </div>

              <div className="account-details-grid">
                <div className="account-stat-box">
                  <div className="account-stat-box__label">Account Number</div>
                  <div className="account-stat-box__val">{accountNumber}</div>
                </div>

                <div className="account-stat-box">
                  <div className="account-stat-box__label">Account Type</div>
                  <div className="account-stat-box__val" style={{ fontFamily: "var(--font-sans)" }}>{accountType}</div>
                </div>

                <div className="account-stat-box">
                  <div className="account-stat-box__label">Customer ID</div>
                  <div className="account-stat-box__val">{customerId}</div>
                </div>

                <div className="account-stat-box">
                  <div className="account-stat-box__label">Account Category</div>
                  <div className="account-stat-box__val" style={{ color: "#0052FF", fontFamily: "var(--font-sans)" }}>Premier Tier</div>
                </div>

                <div className="account-stat-box" style={{ gridColumn: "1 / -1" }}>
                  <div className="account-stat-box__label">Available Ledger Balance</div>
                  <div className="account-stat-box__val" style={{ fontSize: "1.25rem", color: "#10B981" }}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Security & Preferences + Account Activity */}
          <div className="profile-column">
            
            {/* 1. Security & Preferences Card */}
            <div className="profile-card">
              <div className="profile-card__header">
                <h2 className="profile-card__title">
                  <svg className="profile-card__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Security &amp; Credentials
                </h2>
              </div>

              <div className="security-list">
                {/* Password Row */}
                <div className="security-row">
                  <div className="security-row__left">
                    <div className="security-row__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <div>
                      <div className="security-row__label">Account Password</div>
                      <div className="security-row__desc">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="change-password-toggle-btn"
                    onClick={() => setShowChangePassword((prev) => !prev)}
                  >
                    {showChangePassword ? "Close" : "Change"}
                  </button>
                </div>

                {/* 2FA Status Row */}
                <div className="security-row">
                  <div className="security-row__left">
                    <div className="security-row__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div>
                      <div className="security-row__label">Two-Factor Authentication</div>
                      <div className="security-row__desc">NexShield™ Multi-Factor</div>
                    </div>
                  </div>
                  <span className="security-status-tag">Protected</span>
                </div>

                {/* Biometric Login */}
                <div className="security-row">
                  <div className="security-row__left">
                    <div className="security-row__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M12 2a10 10 0 00-6.88 17.23M12 22a10 10 0 006.88-2.77" />
                        <path d="M12 6a6 6 0 00-4.13 10.34" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div>
                      <div className="security-row__label">Biometric Verification</div>
                      <div className="security-row__desc">Device Keyring Ready</div>
                    </div>
                  </div>
                  <span className="security-status-tag">Available</span>
                </div>
              </div>

              {/* Expandable Password Change Form */}
              {showChangePassword && (
                <div className="change-password-box">
                  <div className="change-password-header" onClick={() => setShowChangePassword(false)}>
                    <span className="change-password-title">Update Password</span>
                    <button type="button" className="change-password-toggle-btn">Close</button>
                  </div>

                  {passwordAlert.message && (
                    <div style={{ marginTop: "12px" }}>
                      <AlertBanner
                        type={passwordAlert.type}
                        message={passwordAlert.message}
                        onClose={() => setPasswordAlert({ type: null, message: "" })}
                      />
                    </div>
                  )}

                  <form className="change-password-form" onSubmit={handlePasswordSubmit}>
                    {/* Current Password */}
                    <div className="info-field-row">
                      <label className="info-field-label">Current Password</label>
                      <input
                        name="currentPassword"
                        type="password"
                        className={`form-input ${passwordErrors.currentPassword ? "form-input--error" : ""}`}
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordInputChange}
                      />
                      {passwordErrors.currentPassword && (
                        <span className="form-error-msg">{passwordErrors.currentPassword}</span>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="info-field-row">
                      <label className="info-field-label">New Password</label>
                      <input
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className={`form-input ${passwordErrors.newPassword ? "form-input--error" : ""}`}
                        placeholder="Min 8 chars with letters & numbers"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordInputChange}
                      />
                      {passwordErrors.newPassword && (
                        <span className="form-error-msg">{passwordErrors.newPassword}</span>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="info-field-row">
                      <label className="info-field-label">Confirm New Password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        className={`form-input ${passwordErrors.confirmPassword ? "form-input--error" : ""}`}
                        placeholder="Re-enter new password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordInputChange}
                      />
                      {passwordErrors.confirmPassword && (
                        <span className="form-error-msg">{passwordErrors.confirmPassword}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="profile-save-btn"
                      style={{ marginTop: "4px" }}
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              )}

              {/* Preferences Section with Persisted Switches */}
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--navy-100)" }}>
                <h3 className="profile-card__title" style={{ fontSize: "1.1rem", marginBottom: "14px" }}>
                  Notification Preferences
                </h3>

                <div className="preferences-list">
                  {/* Email Notifications */}
                  <div className="preference-item">
                    <div className="preference-item__details">
                      <span className="preference-item__title">Email Notifications</span>
                      <span className="preference-item__desc">Receive statement and account alerts via email</span>
                    </div>
                    <label className="switch-toggle" aria-label="Toggle email notifications">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={() => handleTogglePreference("emailNotifications")}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  {/* Transaction Alerts */}
                  <div className="preference-item">
                    <div className="preference-item__details">
                      <span className="preference-item__title">Transaction Alerts</span>
                      <span className="preference-item__desc">Real-time alerts for debits and credits</span>
                    </div>
                    <label className="switch-toggle" aria-label="Toggle transaction alerts">
                      <input
                        type="checkbox"
                        checked={preferences.transactionAlerts}
                        onChange={() => handleTogglePreference("transactionAlerts")}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  {/* Marketing Communications */}
                  <div className="preference-item">
                    <div className="preference-item__details">
                      <span className="preference-item__title">Marketing Updates</span>
                      <span className="preference-item__desc">Offers and new product announcements</span>
                    </div>
                    <label className="switch-toggle" aria-label="Toggle marketing communications">
                      <input
                        type="checkbox"
                        checked={preferences.marketingCommunications}
                        onChange={() => handleTogglePreference("marketingCommunications")}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Account Activity Summary Card */}
            <div className="profile-card">
              <div className="profile-card__header">
                <h2 className="profile-card__title">
                  <svg className="profile-card__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Account Activity Summary
                </h2>
              </div>

              <div className="activity-summary-list">
                <div className="activity-summary-row">
                  <span className="activity-summary-label">Last Successful Login:</span>
                  <span className="activity-summary-val">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today" : "Today, 09:30 AM"}</span>
                </div>

                <div className="activity-summary-row">
                  <span className="activity-summary-label">Account Created:</span>
                  <span className="activity-summary-val">{registrationDate ? new Date(registrationDate).toLocaleDateString() : "Jan 15, 2024"}</span>
                </div>

                <div className="activity-summary-row">
                  <span className="activity-summary-label">Last Profile Update:</span>
                  <span className="activity-summary-val">{user?.lastProfileUpdate ? new Date(user.lastProfileUpdate).toLocaleDateString() : "Just now"}</span>
                </div>

                <div className="activity-summary-row">
                  <span className="activity-summary-label">Security Verification:</span>
                  <span className="activity-summary-val" style={{ color: "#10B981" }}>Passed (256-Bit SSL)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
