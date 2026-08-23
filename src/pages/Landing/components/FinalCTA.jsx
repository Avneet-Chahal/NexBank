import React from "react";

/**
 * FinalCTA Component
 * 
 * High-conversion final call-to-action banner:
 * - Heading: "Ready to Experience Better Banking?"
 * - Supporting text: "Open your NexBank account today and take control of your financial future."
 * - Buttons: "Sign In" and "Create Account"
 * 
 * @param {object} props
 * @param {function} props.onNavigate - Page navigation callback
 */
export function FinalCTA({ onNavigate }) {
  return (
    <section className="final-cta-section">
      <div className="final-cta-section__container">
        
        <div className="final-cta-card">
          <div className="final-cta-card__glow" />

          <div className="final-cta-card__content">
            <h2 className="final-cta-card__title">
              Ready to Experience Better Banking?
            </h2>
            
            <p className="final-cta-card__subtitle">
              Open your NexBank account today and take control of your financial future.
            </p>

            <div className="final-cta-card__buttons">
              <button
                type="button"
                id="cta-signin-btn"
                className="final-cta-btn final-cta-btn--primary"
                onClick={() => onNavigate && onNavigate("signin")}
              >
                <span>Sign In</span>
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                id="cta-register-btn"
                className="final-cta-btn final-cta-btn--secondary"
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
          </div>

        </div>

      </div>
    </section>
  );
}

export default FinalCTA;
