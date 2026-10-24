import { INITIAL_DEMO_USERS, STORAGE_KEYS } from "../data/mockUsers.js";
import { getStorageItem, setStorageItem, removeStorageItem } from "../utils/storage.js";

// In-memory authentication token store (held in runtime memory only, NEVER in localStorage)
let inMemoryAuthToken = null;

/**
 * Retrieves the current in-memory JWT authentication token
 * @returns {string|null}
 */
export function getAuthToken() {
  return inMemoryAuthToken;
}

/**
 * Sets the current in-memory JWT authentication token
 * @param {string|null} token
 */
export function setAuthToken(token) {
  inMemoryAuthToken = token || null;
}

/**
 * Initializes and retrieves all stored users from localStorage.
 * If empty, seeds initial demo users.
 * 
 * @returns {Array<object>} List of registered user accounts
 */
export function getStoredUsers() {
  const existingUsers = getStorageItem(STORAGE_KEYS.USERS);

  // If no users are found in localStorage, seed with initial demo dataset
  if (!existingUsers || !Array.isArray(existingUsers) || existingUsers.length === 0) {
    setStorageItem(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
    return INITIAL_DEMO_USERS;
  }

  return existingUsers;
}

/**
 * Persists the updated user list to localStorage
 * @param {Array<object>} users
 * @returns {boolean}
 */
export function saveUsers(users) {
  if (!Array.isArray(users)) return false;
  return setStorageItem(STORAGE_KEYS.USERS, users);
}

/**
 * Checks if an email is already registered using Array.some()
 * 
 * @param {string} email
 * @returns {boolean}
 */
export const checkEmailExists = (email = "") => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.some((user) => user.email.toLowerCase() === normalizedEmail);
};

/**
 * Finds a user by email address
 * 
 * @param {string} email
 * @returns {object|undefined}
 */
export const findUserByEmail = (email = "") => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail);
};

/**
 * Generates a unique NexBank Account Number
 * 
 * @returns {string} Formatted account number (e.g. NB108421)
 */
export function generateAccountNumber() {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `NB${randomSuffix}`;
}

/**
 * Registers a new customer into the simulated LocalStorage database
 * Demonstrates:
 * 
 * @param {object} formData - Registration form input values
 * @returns {Promise<{ success: boolean, user: object|null, message: string }>}
 */
export async function registerUser(formData) {
  const {
    fullName = "",
    email = "",
    mobile = "",
    accountType = "Savings Account",
    password = "",
    dateOfBirth = ""
  } = formData || {};

  const cleanEmail = email.trim().toLowerCase();

  // 1. Attempt secure registration via Express backend API
  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName,
        email: cleanEmail,
        mobile,
        accountType,
        password,
        dateOfBirth
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.error?.message || "Registration failed. Please check your inputs."
      };
    }

    // Retain token in runtime memory only (NEVER stored in localStorage)
    setAuthToken(data.token);

    return {
      success: true,
      user: data.user,
      message: data.message || "Your NexBank account has been created successfully! Please sign in to continue."
    };
  } catch (error) {
    // 2. Offline fallback if backend server is not running
    console.warn("Backend API unreachable, using local registration fallback:", error.message);
  }

  // Check for duplicate email 
  if (checkEmailExists(cleanEmail)) {
    return {
      success: false,
      user: null,
      message: "An account with this email already exists. Please sign in or use a different email."
    };
  }

  // Create Avatar initials (e.g., "John Doe" -> "JD")
  const avatarInitials = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NX";

  // Create new customer account object (fallback)
  const newUser = {
    id: `NX-${Date.now().toString().slice(-4)}`,
    name: fullName.trim(),
    email: cleanEmail,
    mobile: mobile.trim(),
    accountType: accountType,
    accountNumber: generateAccountNumber(),
    accountStatus: "Active",
    dateOfBirth: dateOfBirth || null,
    balance: accountType.toLowerCase().includes("current") ? 3500.0 : 1500.0,
    currency: "USD",
    avatar: avatarInitials,
    registrationDate: new Date().toISOString()
  };

  const currentUsers = getStoredUsers();
  const updatedUsers = [...currentUsers, newUser];
  saveUsers(updatedUsers);

  return {
    success: true,
    user: newUser,
    message: "Your NexBank account has been created successfully! Please sign in to continue."
  };
}

/**
 * Finds a matching user by email and password using a loop
 * 
 * @param {string} email - Entered email
 * @param {string} password - Entered password
 * @returns {object|null} Matched user object or null if not found
 */
export function findUserByCredentials(email, password) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Standard for-loop to iterate and match account records
  for (let i = 0; i < users.length; i = i + 1) {
    const user = users[i];
    // Strict comparisons
    if (user.email.toLowerCase() === normalizedEmail && user.password === password) {
      return user;
    }
  }

  return null;
}

/**
 * Authenticates a user login attempt
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Whether to persist email in localStorage
 * @returns {Promise<{ success: boolean, user: object|null, message: string }>}
 */
export async function loginUser(email, password, rememberMe = false) {
  // 1. Attempt secure authentication via Express backend API
  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        user: null,
        message: data.error?.message || "Invalid email or password. Please verify your credentials."
      };
    }

    // Securely retain JWT in runtime memory only (NEVER in localStorage)
    setAuthToken(data.token);

    const sessionUser = data.user;

    // Persist only non-sensitive session profile in localStorage (NO token, NO password)
    setStorageItem(STORAGE_KEYS.SESSION, {
      user: sessionUser,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });
    setStorageItem("currentUser", sessionUser);

    if (rememberMe) {
      setStorageItem(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim());
    } else {
      removeStorageItem(STORAGE_KEYS.REMEMBERED_EMAIL);
    }

    return {
      success: true,
      user: sessionUser,
      message: data.message || `Welcome back, ${sessionUser.name}! Sign in successful.`
    };
  } catch (error) {
    // 2. Offline fallback if backend server is not running
    console.warn("Backend API unreachable, using local authentication fallback:", error.message);
  }

  // Find user by credentials (local fallback)
  const matchedUser = findUserByCredentials(email, password);

  if (!matchedUser) {
    return {
      success: false,
      user: null,
      message: "Invalid email or password. Please verify your credentials."
    };
  }

  if (matchedUser.accountStatus === "Deactivated" || matchedUser.isActive === false) {
    return {
      success: false,
      user: null,
      message: "Your NexBank account is temporarily deactivated. Please contact support."
    };
  }

  // Create sanitized session object (do not keep plaintext password in active session state)
  const sessionUser = {
    id: matchedUser.id,
    name: matchedUser.name,
    email: matchedUser.email,
    mobile: matchedUser.mobile || "",
    accountNumber: matchedUser.accountNumber,
    accountType: matchedUser.accountType,
    balance: matchedUser.balance,
    currency: matchedUser.currency,
    avatar: matchedUser.avatar,
    lastLoginAt: new Date().toISOString()
  };

  // Persist session and currentUser to localStorage without tokens or passwords
  setStorageItem(STORAGE_KEYS.SESSION, {
    user: sessionUser,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  });
  setStorageItem("currentUser", sessionUser);

  // Handle Remember Me
  if (rememberMe) {
    setStorageItem(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim());
  } else {
    removeStorageItem(STORAGE_KEYS.REMEMBERED_EMAIL);
  }

  return {
    success: true,
    user: sessionUser,
    message: `Welcome back, ${sessionUser.name}! Sign in successful.`
  };
}

/**
 * Retrieves the currently logged in user object from localStorage
 * @returns {object|null} Current user object or null
 */
export function getCurrentUser() {
  const directUser = getStorageItem("currentUser");
  if (directUser && typeof directUser === "object") {
    return directUser;
  }
  const session = getCurrentSession();
  return session && session.user ? session.user : null;
}

/**
 * Retrieves the active logged-in session
 * @returns {object|null}
 */
export function getCurrentSession() {
  const session = getStorageItem(STORAGE_KEYS.SESSION);
  if (!session || !session.user) {
    return null;
  }
  return session;
}

/**
 * Updates the profile information of the current customer in localStorage
 * 
 * @param {object} updatedData - Updated fields ({ name, mobile })
 * @returns {{ success: boolean, user: object, message: string }}
 */
export function updateStoredUserProfile(updatedData) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, user: null, message: "No active user session found." };
  }

  // Generate updated avatar initials if name has changed
  const newName = updatedData.name ? updatedData.name.trim() : currentUser.name;
  const avatarInitials = newName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NX";

  // Merge updated fields using Spread Operator
  const updatedUser = {
    ...currentUser,
    name: newName,
    mobile: updatedData.mobile !== undefined ? updatedData.mobile.trim() : currentUser.mobile,
    avatar: avatarInitials,
    lastProfileUpdate: new Date().toISOString()
  };

  // 1. Update active currentUser & session in LocalStorage
  setStorageItem("currentUser", updatedUser);
  const session = getCurrentSession();
  if (session) {
    setStorageItem(STORAGE_KEYS.SESSION, {
      ...session,
      user: updatedUser
    });
  }

  // 2. Update persistent registered users array
  const allUsers = getStoredUsers();
  const updatedUsersList = allUsers.map((u) => {
    if (u.email.toLowerCase() === currentUser.email.toLowerCase() || u.id === currentUser.id) {
      return {
        ...u,
        name: updatedUser.name,
        mobile: updatedUser.mobile,
        avatar: updatedUser.avatar,
        lastProfileUpdate: updatedUser.lastProfileUpdate
      };
    }
    return u;
  });
  saveUsers(updatedUsersList);

  return {
    success: true,
    user: updatedUser,
    message: "Profile information updated successfully!"
  };
}

/**
 * Changes user password in localStorage data
 * 
 * @param {string} email - Customer email
 * @param {string} currentPassword - Existing password
 * @param {string} newPassword - New password
 * @returns {{ success: boolean, message: string }}
 */
export function updateUserPassword(email, currentPassword, newPassword) {
  const allUsers = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Find user
  const user = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { success: false, message: "User account not found." };
  }

  // Verify current password
  if (user.password !== currentPassword) {
    return { success: false, message: "Current password does not match our records." };
  }

  // Update password in users array
  const updatedUsersList = allUsers.map((u) => {
    if (u.email.toLowerCase() === normalizedEmail) {
      return { ...u, password: newPassword, lastPasswordChange: new Date().toISOString() };
    }
    return u;
  });
  saveUsers(updatedUsersList);

  return {
    success: true,
    message: "Your password has been changed successfully."
  };
}

/**
 * Retrieves customer preferences from localStorage with fallback defaults
 * @returns {{ emailNotifications: boolean, transactionAlerts: boolean, marketingCommunications: boolean }}
 */
export function getUserPreferences() {
  const defaults = {
    emailNotifications: true,
    transactionAlerts: true,
    marketingCommunications: false
  };

  const stored = getStorageItem("userPreferences");
  if (stored && typeof stored === "object") {
    return { ...defaults, ...stored };
  }
  return defaults;
}

/**
 * Saves customer preferences to localStorage
 * @param {object} preferences
 */
export function saveUserPreferences(preferences) {
  if (preferences && typeof preferences === "object") {
    setStorageItem("userPreferences", preferences);
  }
}

/**
 * Logs out the current user by destroying the stored session & currentUser
 */
export function logoutUser() {
  setAuthToken(null);
  removeStorageItem("currentUser");
  removeStorageItem(STORAGE_KEYS.SESSION);
}

/**
 * Retrieves remembered email if saved
 * @returns {string}
 */
export function getRememberedEmail() {
  const savedEmail = getStorageItem(STORAGE_KEYS.REMEMBERED_EMAIL);
  return typeof savedEmail === "string" ? savedEmail : "";
}
