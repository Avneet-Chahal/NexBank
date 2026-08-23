import React, { useEffect } from "react";
import PublicNavbar from "../../components/common/PublicNavbar";
import HeroSection from "./components/HeroSection";
import TrustStrip from "./components/TrustStrip";
import FeaturesSection from "./components/FeaturesSection";
import SecuritySection from "./components/SecuritySection";
import AboutSection from "./components/AboutSection";
import SupportSection from "./components/SupportSection";
import FinalCTA from "./components/FinalCTA";
import LandingFooter from "./components/LandingFooter";
import "./LandingPage.css";

/**
 * NexBank – Public Website Master Component
 * 
 * Renders the 5 Public Pages with the shared PublicNavbar:
 * 1. Home (Hero + 3D Composition + Overview)
 * 2. Features (Dedicated Features Grid)
 * 3. Security (Enterprise Security Panel)
 * 4. About Us (Institutional Statistics & Pillars)
 * 5. Support (Multi-Channel Assistance & FAQ Desk)
 * 
 * Customer Login navigates to Sign In (where PublicNavbar is NOT shown).
 * Create Account navigates to Register (where PublicNavbar is NOT shown).
 * 
 * @param {object} props
 * @param {'home' | 'features' | 'security' | 'about' | 'support'} [props.activePublicPage='home'] - Active public page
 * @param {function} props.onNavigate - Navigation callback
 */
export function LandingPage({ activePublicPage = "home", onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePublicPage]);

  return (
    <div className="landing-layout">
      {/* 
        ========================================================================
        SHARED PUBLIC WEBSITE NAVBAR
        Appears ONLY on: Home | Features | Security | About Us | Support
        Does NOT appear on: Sign In | Register | Dashboard | Profile
        ========================================================================
      */}
      <PublicNavbar activePage={activePublicPage} onNavigate={onNavigate} />

      {/* Page 1: Home */}
      {activePublicPage === "home" && (
        <>
          <HeroSection onNavigate={onNavigate} />
          <TrustStrip />
          <FeaturesSection />
          <SecuritySection />
          <AboutSection />
          <SupportSection onNavigate={onNavigate} />
        </>
      )}

      {/* Page 2: Features */}
      {activePublicPage === "features" && (
        <div className="public-subpage-wrap">
          <FeaturesSection />
          <SecuritySection />
        </div>
      )}

      {/* Page 3: Security */}
      {activePublicPage === "security" && (
        <div className="public-subpage-wrap">
          <SecuritySection />
          <FeaturesSection />
        </div>
      )}

      {/* Page 4: About Us */}
      {activePublicPage === "about" && (
        <div className="public-subpage-wrap">
          <AboutSection />
          <FeaturesSection />
        </div>
      )}

      {/* Page 5: Support */}
      {activePublicPage === "support" && (
        <div className="public-subpage-wrap">
          <SupportSection onNavigate={onNavigate} />
          <AboutSection />
        </div>
      )}

      {/* Final Call to Action */}
      <FinalCTA onNavigate={onNavigate} />

      {/* Public Footer */}
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
