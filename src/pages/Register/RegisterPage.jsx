import React, { useState } from "react";
import BrandLogo from "../../components/common/BrandLogo";
import AlertBanner from "../../components/common/AlertBanner";
import { validateRegisterForm, getPasswordRuleStatus } from "../../utils/validation";
import { registerUser } from "../../services/authService";
import "./Register.css";

/**
 * NexBank – Register Page Component
 * 
 * @param {object} props
 * @param {function} props.onNavigate - Navigation callback function
 */
export function RegisterPage({ onNavigate }) {
  // Form State 
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    accountType: "Savings Account",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false
  });

  // UI & Interaction State
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: null, message: "" });
  const [registeredUser, setRegisteredUser] = useState(null);

  // Live password criteria status evaluation
  const passwordStatus = getPasswordRuleStatus(formData.password);

  /**
   * Generalized input change handler using computed property names and spread operator
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));

    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: ""
      }));
    }

    if (alert.message) {
      setAlert({ type: null, message: "" });
    }
  };

  /**
   * Terms checkbox toggle handler
   */
  const handleCheckboxChange = (event) => {
    const isChecked = event.target.checked;
    setFormData((prevData) => ({
      ...prevData,
      agreedToTerms: isChecked
    }));

    if (errors.agreedToTerms) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        agreedToTerms: ""
      }));
    }
  };

  /**
   * Registration form submission handler
   */
  const handleSubmit = async (event) => {

    event.preventDefault();

    setAlert({ type: null, message: "" });

    // Validate all fields using modular validation function 
    const validationResult = validateRegisterForm(formData);

    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      setAlert({
        type: "error",
        message: "Please correct all highlighted errors before proceeding."
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call simulated LocalStorage registration service
      const result = await registerUser(formData);

      if (result.success) {
        setRegisteredUser(result.user);
      } else {
        setAlert({
          type: "error",
          message: result.message
        });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: "An unexpected error occurred during account registration. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-layout">
      {/* Left Decorative Showcase Panel (Matches SignIn.css) */}
      <aside className="register-showcase">
        <div className="register-showcase__ambient" />

        <header className="register-showcase__header">
          <BrandLogo size="large" light showTagline onClick={() => onNavigate && onNavigate("landing")} />
        </header>

        <div className="register-showcase__content">
          <div className="register-showcase__badge">
            <span className="register-showcase__badge-dot" />
            NexBank Premier Membership
          </div>

          <h1 className="register-showcase__title">
            Start Your Banking Journey.
          </h1>

          <p className="register-showcase__desc">
            Open your NexBank digital account and experience secure, convenient banking designed for modern customers.
          </p>

          <div className="register-showcase__features">
            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2 className="showcase-feature__title">Secure Digital Banking</h2>
                <p className="showcase-feature__subtitle">Protected with multi-factor verification and real-time fraud alerts.</p>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <h2 className="showcase-feature__title">Fast Account Setup</h2>
                <p className="showcase-feature__subtitle">Instant digital account number assignment and zero waiting periods.</p>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 className="showcase-feature__title">24/7 Account Access</h2>
                <p className="showcase-feature__subtitle">Manage finances, view balances, and transfer assets anytime, anywhere.</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="register-showcase__footer">
          <span>NexBank Client Onboarding v1.0.0</span>
        </footer>
      </aside>

      {/* Right Content Area */}
      <main className="register-main">
        <div className="register-container">

          {/* Mobile Brand Header */}
          <div className="register-mobile-header">
            <BrandLogo size="default" showTagline onClick={() => onNavigate && onNavigate("landing")} />
          </div>

          {/* Render Success View if Registration Completed */}
          {registeredUser ? (
            <div className="registration-success-card">
              <div className="success-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="32" height="32">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className="success-card-title">Account Created Successfully!</h2>
              <p className="success-card-desc">
                Welcome to NexBank, <strong>{registeredUser.name}</strong>. Your account has been provisioned and is ready for use.
              </p>

              <div className="success-details-box">
                <div className="success-detail-row">
                  <span className="success-detail-label">Account Number:</span>
                  <span className="success-detail-val">{registeredUser.accountNumber}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Registered Email:</span>
                  <span className="success-detail-val">{registeredUser.email}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Account Type:</span>
                  <span className="success-detail-val">{registeredUser.accountType}</span>
                </div>
                <div className="success-detail-row">
                  <span className="success-detail-label">Account Status:</span>
                  <span className="success-detail-val" style={{ color: "#10B981" }}>{registeredUser.accountStatus}</span>
                </div>
              </div>

              <button
                type="button"
                id="register-continue-signin-btn"
                className="success-continue-btn"
                onClick={() => onNavigate && onNavigate("signin")}
              >
                <span>Continue to Sign In</span>
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            /* Registration Form View */
            <>
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

              <div className="register-header">
                <h2 className="register-header__title">Create Your Account</h2>
                <p className="register-header__subtitle">
                  Register with NexBank to access your digital banking services.
                </p>
              </div>

              {/* Alert Feedback Banner */}
              {alert.message && (
                <AlertBanner
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert({ type: null, message: "" })}
                />
              )}

              <form className="register-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="reg-fullname" className="form-label">
                    Full Name <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    className={`form-input ${errors.fullName ? "form-input--error" : ""}`}
                    placeholder="e.g. Johnathan Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "reg-fullname-error" : undefined}
                  />
                  {errors.fullName && (
                    <span id="reg-fullname-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label htmlFor="reg-email" className="form-label">
                    Email Address <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    className={`form-input ${errors.email ? "form-input--error" : ""}`}
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "reg-email-error" : undefined}
                  />
                  {errors.email && (
                    <span id="reg-email-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="form-group">
                  <label htmlFor="reg-mobile" className="form-label">
                    Mobile Number <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="reg-mobile"
                    name="mobile"
                    type="tel"
                    className={`form-input ${errors.mobile ? "form-input--error" : ""}`}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={Boolean(errors.mobile)}
                    aria-describedby={errors.mobile ? "reg-mobile-error" : undefined}
                  />
                  {errors.mobile && (
                    <span id="reg-mobile-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.mobile}
                    </span>
                  )}
                </div>

                {/* Row: Account Type & Date of Birth */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reg-account-type" className="form-label">
                      Account Type <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                    </label>
                    <select
                      id="reg-account-type"
                      name="accountType"
                      className="form-select"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      aria-required="true"
                    >
                      <option value="Savings Account">Savings Account</option>
                      <option value="Current Account">Current Account</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-dob" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      id="reg-dob"
                      name="dateOfBirth"
                      type="date"
                      className="form-input"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      autoComplete="bday"
                    />
                  </div>
                </div>

                {/* Password Field with Toggle */}
                <div className="form-group">
                  <label htmlFor="reg-password" className="form-label">
                    Password <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`form-input form-input--has-trailing ${errors.password ? "form-input--error" : ""}`}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "reg-password-error" : undefined}
                    />
                    <button
                      type="button"
                      className="form-trailing-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Dynamic Real-Time Password Requirements Checklist */}
                  <div className="password-requirements-box">
                    <div className="password-requirements-header">
                      <span>Password Requirements</span>
                      <span className={`password-strength-pill ${passwordStatus.isValid ? "password-strength-pill--strong" : ""}`}>
                        {passwordStatus.isValid ? "Strong" : "Requirements"}
                      </span>
                    </div>

                    <ul className="password-requirements-list">
                      {passwordStatus.criteria.map((rule) => (
                        <li
                          key={rule.id}
                          className={`password-rule-item ${rule.met ? "password-rule-item--met" : ""}`}
                        >
                          <span className="password-rule-icon">
                            {rule.met ? (
                              <svg viewBox="0 0 20 20" fill="#10B981" width="14" height="14" aria-hidden="true">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 20 20" fill="#94A3B8" width="14" height="14" aria-hidden="true">
                                <circle cx="10" cy="10" r="4" />
                              </svg>
                            )}
                          </span>
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {errors.password && (
                    <span id="reg-password-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password Field with Toggle */}
                <div className="form-group">
                  <label htmlFor="reg-confirm-password" className="form-label">
                    Confirm Password <span style={{ color: "#EF4444" }} aria-hidden="true">*</span>
                  </label>
                  <div className="form-input-wrapper">
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-input form-input--has-trailing ${errors.confirmPassword ? "form-input--error" : ""}`}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "reg-confirm-password-error" : undefined}
                    />
                    <button
                      type="button"
                      className="form-trailing-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span id="reg-confirm-password-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Terms & Conditions Checkbox */}
                <div className="terms-group">
                  <label htmlFor="reg-terms" className="terms-label">
                    <input
                      id="reg-terms"
                      name="agreedToTerms"
                      type="checkbox"
                      className="terms-checkbox"
                      checked={formData.agreedToTerms}
                      onChange={handleCheckboxChange}
                      disabled={isLoading}
                      aria-required="true"
                      aria-invalid={Boolean(errors.agreedToTerms)}
                      aria-describedby={errors.agreedToTerms ? "reg-terms-error" : undefined}
                    />
                    <span>
                      I agree to the <span className="terms-link">NexBank Terms &amp; Conditions</span> and Privacy Policy.
                    </span>
                  </label>
                  {errors.agreedToTerms && (
                    <span id="reg-terms-error" className="form-error-msg" role="alert">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.agreedToTerms}
                    </span>
                  )}
                </div>

                {/* Create Account Submit Button */}
                <button
                  id="register-submit-button"
                  type="submit"
                  className="register-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      <span>Provisioning Account...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Back to Sign In Link */}
              <div className="register-footer">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="form-link-btn register-footer__link"
                  onClick={() => onNavigate && onNavigate("signin")}
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
