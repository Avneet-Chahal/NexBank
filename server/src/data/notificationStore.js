/**
 * NexBank – In-Memory Notification Data Store (Development / Fallback Mode)
 */

let notifications = [
  {
    id: "NOTIF-1",
    userId: "NX-8801",
    title: "Monthly Salary Credited",
    message: "Your monthly compensation of ₹52,000 has been cleared and credited to your primary account.",
    type: "activity",
    isRead: false,
    createdAt: "2026-08-18T09:05:00.000Z"
  },
  {
    id: "NOTIF-2",
    userId: "NX-8801",
    title: "Budget Threshold Warning",
    message: "Shopping category spending has reached 82% of your monthly ₹5,000 allowance.",
    type: "budget_warning",
    isRead: false,
    createdAt: "2026-08-19T10:15:00.000Z"
  },
  {
    id: "NOTIF-3",
    userId: "NX-8801",
    title: "Upcoming Bill Reminder",
    message: "Fiber Internet bill of ₹999 is scheduled for auto-clearance in 3 days.",
    type: "bill_reminder",
    isRead: true,
    createdAt: "2026-08-15T12:00:00.000Z"
  },
  {
    id: "NOTIF-4",
    userId: "NX-8801",
    title: "NexShield Security Session Verified",
    message: "A new secure sign-in was verified from Chrome browser on Windows (Current session).",
    type: "security",
    isRead: true,
    createdAt: "2026-08-14T08:20:00.000Z"
  }
];

export function getUserNotifications(userId) {
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markAsRead(id, userId) {
  const item = notifications.find((n) => n.id === id && n.userId === userId);
  if (item) {
    item.isRead = true;
    return item;
  }
  return null;
}

export function markAllAsRead(userId) {
  notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  return true;
}

export function deleteNotification(id, userId) {
  const idx = notifications.findIndex((n) => n.id === id && n.userId === userId);
  if (idx !== -1) {
    notifications.splice(idx, 1);
    return true;
  }
  return false;
}

export function createNotification({ title, message, type = "activity" }, userId) {
  const newNotif = {
    id: `NOTIF-${Date.now().toString().slice(-4)}`,
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(newNotif);
  return newNotif;
}
