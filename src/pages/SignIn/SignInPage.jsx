import React, { useState, useEffect } from "react";
import BrandLogo from "../../components/common/BrandLogo";
import AlertBanner from "../../components/common/AlertBanner";
import { validateLoginForm } from "../../utils/validation";
import { loginUser, getRememberedEmail } from "../../services/authService";
import "./SignIn.css";

/**
 * NexBank – Sign In Page Component
 * 
 * @param {object} props
 * @param {function} props.onNavigate - Page navigation callback (e.g. to 'register' or 'dashboard')
 * @param {function} props.onLoginSuccess - Callback invoked when login succeeds
 */
export function SignInPage({ onNavigate, onLoginSuccess }) {
  // Controlled form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback state
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Initialize remembered email on mount if exists
  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  /**
   * Handle Email field change
   * Clears inline error when user starts correcting
   */
  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors((prevErrors) => ({ ...prevErrors, email: "" }));
    }
    if (alert.message) {
      setAlert({ type: null, message: "" });
    }
  };

  /**
   * Handle Password field change
   */
  const handlePasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors((prevErrors) => ({ ...prevErrors, password: "" }));
    }
    if (alert.message) {
      setAlert({ type: null, message: "" });
    }
  };

  /**
   * Toggle Password Visibility
   */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Toggle Remember Me checkbox
   */
  const handleToggleRememberMe = (event) => {
    setRememberMe(event.target.checked);
  };

  /**
   * Auto-fill demo credentials
   */
  const handleFillDemo = () => {
    setEmail("demo@nexbank.com");
    setPassword("Demo@123");
    setErrors({});
    setAlert({
      type: "info",
      message: "Pre-filled default customer credentials."
    });
  };

  /**
   * Form Submission Handler
   */
  const handleSubmit = async (event) => {
    // Prevent default browser form refresh
    event.preventDefault();

    // Reset previous alerts
    setAlert({ type: null, message: "" });

    const validationResult = validateLoginForm(email, password);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      setAlert({
        type: "error",
        message: "Please correct the highlighted errors before submitting."
      });
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Call simulated authentication service
      const result = await loginUser(email, password, rememberMe);

      if (result.success) {
        setAlert({
          type: "success",
          message: result.message
        });

        // Notify parent / prepare navigation after brief feedback
        if (typeof onLoginSuccess === "function") {
          setTimeout(() => {
            onLoginSuccess(result.user);
          }, 800);
        }
      } else {
        setAlert({
          type: "error",
          message: result.message
        });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-layout">
      {/* Left Decorative Showcase Panel (Desktop View) */}
      <aside className="signin-showcase">
        <div className="signin-showcase__ambient" />

        <header className="signin-showcase__header">
          <BrandLogo size="large" light showTagline onClick={() => onNavigate && onNavigate("landing")} />
        </header>

        <div className="signin-showcase__content">
          <div className="signin-showcase__badge">
            <span className="signin-showcase__badge-dot" />
            NexShield™ Enterprise Protection
          </div>

          <h1 className="signin-showcase__title">
            The Next Generation of Corporate & Personal Banking.
          </h1>

          <p className="signin-showcase__desc">
            Experience real-time intelligence, multi-tier asset management, and seamless financial control with zero compromise on security.
          </p>

          <div className="signin-showcase__features">
            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="showcase-feature__title">256-bit End-to-End Encryption</h2>
                <p className="showcase-feature__subtitle">Bank-grade data layer and simulated vault verification.</p>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h2 className="showcase-feature__title">Instant Settlement Engine</h2>
                <p className="showcase-feature__subtitle">Ultra-fast balance adjustments and ledger auditing.</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="signin-showcase__footer">
          <span>NexBank Core Banking System v1.0.0</span>
        </footer>
      </aside>

      {/* Right Form Card */}
      <main className="signin-main">
        <div className="signin-container">

          {/* Mobile Brand Header */}
          <div className="signin-mobile-header">
            <BrandLogo size="default" showTagline onClick={() => onNavigate && onNavigate("landing")} />
          </div>

          {/* Back to Home Navigation */}
          <div className="auth-back-nav">
            <button
              type="button"
              className="auth-back-link"
              onClick={() => onNavigate && onNavigate("landing")}
              aria-label="Back to NexBank Home"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className="auth-back-link__arrow">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to NexBank Home</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="signin-header">
            <h2 className="signin-header__title">Welcome Back</h2>
            <p className="signin-header__subtitle">
              Sign in to access your digital banking account.
            </p>
          </div>

          {/* Alert Message Banner */}
          {alert.message && (
            <AlertBanner
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert({ type: null, message: "" })}
            />
          )}

          {/* Demo Credentials Quick Pill */}
          <div className="signin-demo-pill">
            <div className="signin-demo-pill__info">
              <span className="signin-demo-pill__label">
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ color: "#0052FF" }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Demo Credentials:
              </span>
              <span className="signin-demo-pill__text">demo@nexbank.com &bull; Demo@123</span>
            </div>
            <button
              type="button"
              className="signin-demo-pill__btn"
              onClick={handleFillDemo}
              title="Click to pre-fill test credentials"
            >
              Fill Demo
            </button>
          </div>

          {/* Sign In Form */}
          <form className="signin-form" onSubmit={handleSubmit} noValidate>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">
                Email Address
              </label>
              <div className="form-input-wrapper">
                <input
                  id="signin-email"
                  type="email"
                  className={`form-input ${errors.email ? "form-input--error" : ""}`}
                  placeholder="name@nexbank.com"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <span className="form-error-msg">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="signin-password" className="form-label">
                Password
              </label>
              <div className="form-input-wrapper">
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input form-input--has-trailing ${errors.password ? "form-input--error" : ""}`}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="form-trailing-btn"
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    /* Eye Off Icon */
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye Open Icon */
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="form-error-msg">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="form-checkbox-label">
                <input
                  id="signin-remember"
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={handleToggleRememberMe}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="form-link-btn"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Submit Button */}
            <button
              id="signin-submit-button"
              type="submit"
              className="signin-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Switch to Register link */}
          <div className="signin-footer">
            <span>Don&apos;t have a NexBank account?</span>
            <button
              type="button"
              className="form-link-btn signin-footer__link"
              onClick={() => onNavigate && onNavigate("register")}
            >
              Create an account
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Password Recovery</h3>
              <button
                type="button"
                className="nex-alert__close-btn"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="modal-body">
              For this CA1 evaluation build, account recovery is simulated. You can sign in immediately using the default evaluation credentials:
              <br /><br />
              <strong>Email:</strong> <code>demo@nexbank.com</code><br />
              <strong>Password:</strong> <code>Demo@123</code>
            </p>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowForgotModal(false)}
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignInPage;
