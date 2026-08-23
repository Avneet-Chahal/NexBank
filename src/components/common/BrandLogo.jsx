import React from "react";

/**
 * NexBank Brand Logo Component
 * Renders the official modern NexBank geometric emblem and typography
 */
export function BrandLogo({ size = "default", light = false, showTagline = false, onClick }) {
  const isLarge = size === "large";

  return (
    <div 
      className={`nex-brand ${light ? "nex-brand--light" : ""}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      <div className={`nex-brand__icon-wrap ${isLarge ? "nex-brand__icon-wrap--lg" : ""}`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="nex-brand__svg"
        >
          {/* Outer Rounded Shield / Hexagon Shape */}
          <rect width="40" height="40" rx="10" fill="url(#brandGrad)" />
          {/* Dynamic Interlocking Geometry */}
          <path
            d="M12 28V12L20 20L28 12V28"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 21V28"
            stroke="#60A5FA"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="brandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0052FF" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="nex-brand__text">
        <span className={`nex-brand__name ${isLarge ? "nex-brand__name--lg" : ""}`}>
          Nex<span className="nex-brand__highlight">Bank</span>
        </span>
        {showTagline && (
          <span className="nex-brand__tagline">Enterprise Digital Banking</span>
        )}
      </div>
    </div>
  );
}

export default BrandLogo;
