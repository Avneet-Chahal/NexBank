import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const NOTIF_PREFS_KEY = "nexbank_notification_preferences";
const LOCAL_NOTIFS_KEY = "nexbank_local_notifications";

const INITIAL_DEMO_NOTIFS = [
  {
    id: "NOTIF-1",
    title: "Monthly Salary Credited",
    message: "Your monthly compensation of ₹52,000 has been cleared and credited to your primary account.",
    type: "activity",
    isRead: false,
    createdAt: "2026-08-18T09:05:00.000Z"
  },
  {
    id: "NOTIF-2",
    title: "Budget Threshold Warning",
    message: "Shopping category spending has reached 82% of your monthly ₹5,000 allowance.",
    type: "budget_warning",
    isRead: false,
    createdAt: "2026-08-19T10:15:00.000Z"
  },
  {
    id: "NOTIF-3",
    title: "Upcoming Bill Reminder",
    message: "Fiber Internet bill of ₹999 is scheduled for auto-clearance in 3 days.",
    type: "bill_reminder",
    isRead: true,
    createdAt: "2026-08-15T12:00:00.000Z"
  },
  {
    id: "NOTIF-4",
    title: "NexShield Security Session Verified",
    message: "A new secure sign-in was verified from Chrome browser on Windows (Current session).",
    type: "security",
    isRead: true,
    createdAt: "2026-08-14T08:20:00.000Z"
  }
];

function getLocalNotifications() {
  const saved = getStorageItem(LOCAL_NOTIFS_KEY);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  setStorageItem(LOCAL_NOTIFS_KEY, INITIAL_DEMO_NOTIFS);
  return INITIAL_DEMO_NOTIFS;
}

function saveLocalNotifications(list) {
  setStorageItem(LOCAL_NOTIFS_KEY, list);
}

/**
 * Fetch notifications from backend or local fallback
 */
export async function fetchNotifications() {
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("http://localhost:5000/api/notifications", { headers });
    if (res.ok) {
      const data = await res.json();
      return {
        notifications: data.data || [],
        unreadCount: data.unreadCount || 0,
        source: data.source || "Express Backend"
      };
    }
  } catch (err) {
    console.warn("Backend notifications unreachable, using local fallback:", err.message);
  }

  const local = getLocalNotifications();
  const unreadCount = local.filter((n) => !n.isRead).length;
  return {
    notifications: local,
    unreadCount,
    source: "Resilient Demo Storage (Offline)"
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id) {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: "PATCH",
      headers
    });
  } catch (err) {
    console.warn("Backend offline, updating local notifs:", err.message);
  }

  const local = getLocalNotifications();
  const item = local.find((n) => n.id === id || n._id === id);
  if (item) {
    item.isRead = true;
    saveLocalNotifications(local);
  }
  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch("http://localhost:5000/api/notifications/mark-all-read", {
      method: "PATCH",
      headers
    });
  } catch (err) {
    console.warn("Backend offline, updating local notifs:", err.message);
  }

  const local = getLocalNotifications();
  local.forEach((n) => {
    n.isRead = true;
  });
  saveLocalNotifications(local);
  return true;
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(id) {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(`http://localhost:5000/api/notifications/${id}`, {
      method: "DELETE",
      headers
    });
  } catch (err) {
    console.warn("Backend offline, dismissing local notif:", err.message);
  }

  const local = getLocalNotifications();
  const filtered = local.filter((n) => n.id !== id && n._id !== id);
  saveLocalNotifications(filtered);
  return true;
}

/**
 * Notification preferences (Budget warnings, Upcoming bill reminders, Security notices)
 */
export function getNotificationPreferences() {
  const defaults = {
    budgetAlerts: true,
    billReminders: true,
    securityNotices: true,
    accountActivity: true
  };
  const saved = getStorageItem(NOTIF_PREFS_KEY);
  return saved && typeof saved === "object" ? { ...defaults, ...saved } : defaults;
}

export function saveNotificationPreferences(preferences) {
  return setStorageItem(NOTIF_PREFS_KEY, preferences);
}
