import bcrypt from "bcryptjs";

/**
 * NexBank – User Data Store (Backend Authentication Dataset)
 * 
 * Demonstrates:
 * - Secure password hashing with bcryptjs (salt rounds: 10)
 * - Zero plaintext password storage
 * - Sanitized user projection (omits password hashes from API responses)
 */

// Generate bcrypt hash for demo customer: "Demo@123"
const DEMO_PASSWORD_HASH = bcrypt.hashSync("Demo@123", 10);

// In-memory persistent users collection
let users = [
  {
    id: "NX-8801",
    name: "Demo Customer",
    email: "demo@nexbank.com",
    passwordHash: DEMO_PASSWORD_HASH,
    accountNumber: "NB8577145",
    accountType: "Premier Checking Account",
    balance: 84250.75,
    currency: "INR",
    mobile: "9876543210",
    accountStatus: "Active",
    avatar: "DC",
    createdAt: "2024-01-15T08:30:00.000Z"
  }
];

/**
 * Strips sensitive authentication fields (passwordHash) before returning to caller
 * 
 * @param {object} user - Raw database user object
 * @returns {object} Sanitized user object safe for JSON responses
 */
export function sanitizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const { passwordHash, password, ...sanitized } = user;
  return sanitized;
}

/**
 * Finds user by email address (case-insensitive)
 * 
 * @param {string} email
 * @returns {object|null}
 */
export function findUserByEmail(email = "") {
  const cleanEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

/**
 * Finds user by unique ID
 * 
 * @param {string} id
 * @returns {object|null}
 */
export function findUserById(id = "") {
  return users.find((u) => u.id === id) || null;
}

/**
 * Registers a new user with bcrypt-hashed password
 * 
 * @param {object} data
 * @param {string} data.fullName
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} [data.mobile]
 * @param {string} [data.accountType]
 * @returns {Promise<object>} Created user record (sanitized)
 */
export async function createUser(data) {
  const {
    fullName,
    email,
    password,
    mobile = "",
    accountType = "Savings Account"
  } = data;

  const cleanEmail = email.trim().toLowerCase();

  // Hash password using bcrypt (10 salt rounds)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Generate unique account number and user ID
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const accountNumber = `NB${randomSuffix}`;
  const userId = `NX-${Date.now().toString().slice(-4)}`;

  // Create avatar initials
  const avatar = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NX";

  const newUser = {
    id: userId,
    name: fullName.trim(),
    email: cleanEmail,
    passwordHash: passwordHash,
    mobile: mobile.trim(),
    accountNumber: accountNumber,
    accountType: accountType,
    accountStatus: "Active",
    balance: accountType.toLowerCase().includes("current") ? 3500.0 : 1500.0,
    currency: "INR",
    avatar: avatar,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  return sanitizeUser(newUser);
}

/**
 * Compares an entered plaintext password against a stored bcrypt hash
 * 
 * @param {string} enteredPassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(enteredPassword, storedHash) {
  if (!enteredPassword || !storedHash) return false;
  return bcrypt.compare(enteredPassword, storedHash);
}

/**
 * Updates a user's password after verifying their current password
 * 
 * @param {string} id
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function changeUserPassword(id, currentPassword, newPassword) {
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { success: false, message: "User account not found." };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Current password does not match." };
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  return { success: true };
}

// In-memory security events audit log
const securityEventsLog = [
  {
    id: "SEC-1",
    event: "Active Session Verified",
    device: "Chrome on Windows",
    ipAddress: "127.0.0.1 (Localhost)",
    timestamp: new Date().toISOString(),
    status: "success"
  },
  {
    id: "SEC-2",
    event: "NexShield 256-Bit TLS Handshake",
    device: "API Gateway",
    ipAddress: "127.0.0.1",
    timestamp: "2026-08-18T08:20:00.000Z",
    status: "success"
  },
  {
    id: "SEC-3",
    event: "Account Provisioned & Enrolled",
    device: "NexBank Core Auth",
    ipAddress: "Internal",
    timestamp: "2024-01-15T08:30:00.000Z",
    status: "info"
  }
];

export function getUserSecurityEvents(userId) {
  return securityEventsLog;
}

/**
 * Updates a user's avatar in the in-memory store
 * @param {string} id
 * @param {string} avatarUrl
 * @returns {object|null}
 */
export function updateUserAvatar(id, avatarUrl) {
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index].avatar = avatarUrl;
    return sanitizeUser(users[index]);
  }
  return null;
}

/**
 * Helper to inspect registered user count (for tests)
 */
export function getUserCount() {
  return users.length;
}

