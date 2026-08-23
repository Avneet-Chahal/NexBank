/**
 * NexBank – Mock User Data Store
 */

// Initial seed customer account
export const INITIAL_DEMO_USERS = [
  {
    id: "NX-8801",
    name: "Demo Customer",
    email: "demo@nexbank.com",
    password: "Demo@123", 
    accountNumber: "4501 8820 9104",
    accountType: "Premier Checking Account",
    balance: 28450.75,
    currency: "USD",
    isActive: true,
    avatar: "DC",
    createdAt: "2024-01-15T08:30:00.000Z"
  }
];

// LocalStorage Keys (using strict constants)
export const STORAGE_KEYS = {
  USERS: "nexbank_registered_users",
  SESSION: "nexbank_active_session",
  REMEMBERED_EMAIL: "nexbank_remembered_email"
};
