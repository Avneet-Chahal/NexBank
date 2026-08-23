import React from "react";

/**
 * AlertBanner Component
 * Displays contextual feedback messages (Error, Success, Info)
 * 
 * @param {object} props
 * @param {'error' | 'success' | 'info'} props.type
 * @param {string} props.message
 * @param {function} [props.onClose]
 */
export function AlertBanner({ type = "info", message, onClose }) {
  if (!message) return null;

  const isError = type === "error";
  const isSuccess = type === "success";

  return (
    <div
      className={`nex-alert nex-alert--${type}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="nex-alert__icon">
        {isError && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {isSuccess && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {!isError && !isSuccess && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <div className="nex-alert__content">
        <p className="nex-alert__message">{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="nex-alert__close-btn"
          aria-label="Dismiss alert"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
