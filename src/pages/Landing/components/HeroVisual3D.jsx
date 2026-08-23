import React from "react";

/**
 * HeroVisual3D Component
 * 
 * Renders the realistic 3D digital banking composition containing:
 * - Ambient radial glow halo
 * - High-definition 3D composition with smartphone running NexBank app,
 *   angled dark-blue metallic credit card, golden rupee coins, and security shield
 * - Layered floating micro-badges with subtle floating animations
 */
export function HeroVisual3D() {
  return (
    <div className="hero-visual">
      {/* Ambient background glow elements */}
      <div className="hero-visual__ambient-ring" />
      <div className="hero-visual__ambient-glow" />

      {/* Main 3D Artwork Showcase Container */}
      <div className="hero-visual__composition">
        <img
          src="/images/nexbank-hero-3d.jpg"
          alt="NexBank 3D Digital Banking Platform"
          className="hero-visual__image"
          loading="eager"
        />

        {/* Floating Interactive Micro-cards for extra depth and realism */}
        <div className="hero-visual__floating-card hero-visual__floating-card--top-left">
          <div className="floating-card__icon floating-card__icon--shield">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="floating-card__content">
            <span className="floating-card__title">NexShield™ Protected</span>
            <span className="floating-card__subtitle">256-Bit Live Vault</span>
          </div>
        </div>

        <div className="hero-visual__floating-card hero-visual__floating-card--bottom-right">
          <div className="floating-card__icon floating-card__icon--bolt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="floating-card__content">
            <span className="floating-card__title">Instant Settlement</span>
            <span className="floating-card__subtitle">Real-time Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroVisual3D;
