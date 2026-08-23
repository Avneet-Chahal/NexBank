import React, { useState, useEffect } from "react";
import LandingPage from "./pages/Landing/LandingPage";
import SignInPage from "./pages/SignIn/SignInPage";
import RegisterPage from "./pages/Register/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import { getCurrentUser, logoutUser } from "./services/authService";
import "./App.css";

/**
 * NexBank – Root Application Component
 * 
 * Manages top-level application routing and session state across:
 * - Public Website (Shared PublicNavbar):
 *   1. Home (/ or home)
 *   2. Features (/features)
 *   3. Security (/security)
 *   4. About Us (/about)
 *   5. Support (/support)
 * 
 * - Authentication Pages (NO PublicNavbar, Back to Home link):
 *   - Sign In (/signin)
 *   - Register (/register)
 * 
 * - Authenticated Application (Separate Authenticated TopNavbar):
 *   - Dashboard (/dashboard)
 *   - Profile (/profile)
 */
export function App() {
  
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [currentPage, setCurrentPage] = useState(() => {
    const activeUser = getCurrentUser();
    return activeUser ? "dashboard" : "home";
  });

  // Check and synchronize session state on mount & navigation changes
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
      if (currentPage === "dashboard" || currentPage === "profile") {
        setCurrentPage("home");
      }
    }
  }, [currentPage]);

  /**
   * Handle Navigation between pages with authentication guards
   * @param {'home' | 'landing' | 'features' | 'security' | 'about' | 'support' | 'signin' | 'register' | 'dashboard' | 'profile'} page
   */
  const handleNavigate = (page) => {
    // Alias 'landing' to 'home'
    const targetPage = page === "landing" ? "home" : page;

    // Authentication Guard: Disallow direct access to Dashboard or Profile if unauthenticated
    if ((targetPage === "dashboard" || targetPage === "profile") && !currentUser) {
      setCurrentPage("signin");
      return;
    }

    setCurrentPage(targetPage);
  };

  /**
   * Handle successful login from SignInPage
   * @param {object} user - Authenticated user record
   */
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  /**
   * Handle dynamic user profile updates from ProfilePage
   * Ensures Dashboard and TopNavbar immediately reflect edited name/avatar
   * @param {object} updatedUser - Updated user record
   */
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentPage("home");
  };

  // Public pages list that share the PublicNavbar
  const isPublicPage = ["home", "landing", "features", "security", "about", "support"].includes(currentPage);

  return (
    <div className="nex-app">
      {/* 
        ========================================================================
        1. PUBLIC WEBSITE PAGES (Shares PublicNavbar across Home, Features, Security, About, Support)
        ========================================================================
      */}
      {isPublicPage && (
        <LandingPage
          activePublicPage={currentPage === "landing" ? "home" : currentPage}
          onNavigate={handleNavigate}
        />
      )}

      {/* 
        ========================================================================
        2. AUTHENTICATION PAGES (❌ NO PublicNavbar here, only auth UI + 'Back to Home')
        ========================================================================
      */}
      {/* Page: Sign In */}
      {currentPage === "signin" && (
        <SignInPage
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Page: Register */}
      {currentPage === "register" && (
        <RegisterPage
          onNavigate={handleNavigate}
        />
      )}

      {/* 
        ========================================================================
        3. AUTHENTICATED APPLICATION (Uses existing Authenticated TopNavbar)
        ========================================================================
      */}
      {/* Page: Dashboard */}
      {currentPage === "dashboard" && currentUser && (
        <DashboardPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Profile */}
      {currentPage === "profile" && currentUser && (
        <ProfilePage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}

export default App;
