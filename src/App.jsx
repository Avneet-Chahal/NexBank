import React, { useState, useEffect } from "react";
import LandingPage from "./pages/Landing/LandingPage";
import SignInPage from "./pages/SignIn/SignInPage";
import RegisterPage from "./pages/Register/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import BudgetsPage from "./pages/Budgets/BudgetsPage";
import SavingsGoalsPage from "./pages/Savings/SavingsGoalsPage";
import CardsPage from "./pages/Cards/CardsPage";
import StatementsPage from "./pages/Statements/StatementsPage";
import SupportTicketsPage from "./pages/Support/SupportTicketsPage";
import { getCurrentUser, logoutUser } from "./services/authService";
import "./App.css";

const PROTECTED_PAGES = [
  "dashboard",
  "profile",
  "budgets",
  "savings",
  "cards",
  "statements",
  "support-tickets"
];

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
 * - Authentication Pages:
 *   - Sign In (/signin)
 *   - Register (/register)
 * 
 * - Authenticated Application:
 *   - Dashboard (/dashboard)
 *   - Budgets (/budgets)
 *   - Savings Goals (/savings)
 *   - Cards (/cards)
 *   - Statements (/statements)
 *   - Support Tickets (/support-tickets)
 *   - Profile & Security (/profile)
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
      if (PROTECTED_PAGES.includes(currentPage)) {
        setCurrentPage("home");
      }
    }
  }, [currentPage]);

  /**
   * Handle Navigation between pages with authentication guards
   * @param {string} page
   */
  const handleNavigate = (page) => {
    // Alias 'landing' to 'home'
    const targetPage = page === "landing" ? "home" : page;

    // Authentication Guard: Disallow direct access to protected pages if unauthenticated
    if (PROTECTED_PAGES.includes(targetPage) && !currentUser) {
      setCurrentPage("signin");
      return;
    }

    setCurrentPage(targetPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        2. AUTHENTICATION PAGES 
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
        3. AUTHENTICATED APPLICATION
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

      {/* Page: Budgets */}
      {currentPage === "budgets" && currentUser && (
        <BudgetsPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Savings Goals */}
      {currentPage === "savings" && currentUser && (
        <SavingsGoalsPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Cards Management */}
      {currentPage === "cards" && currentUser && (
        <CardsPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Statements & Receipts */}
      {currentPage === "statements" && currentUser && (
        <StatementsPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Support Tickets */}
      {currentPage === "support-tickets" && currentUser && (
        <SupportTicketsPage
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Page: Profile & Security */}
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
