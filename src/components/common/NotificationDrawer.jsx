import React, { useState, useEffect } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  getNotificationPreferences,
  saveNotificationPreferences
} from "../../services/notificationService";
import "./NotificationDrawer.css";

export function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(() => getNotificationPreferences());
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener("nexbank_notification_updated", handleUpdate);
    return () => window.removeEventListener("nexbank_notification_updated", handleUpdate);
  }, []);

  const loadData = async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const handleMarkItemRead = async (id, e) => {
    e.stopPropagation();
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent("nexbank_notification_updated"));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    window.dispatchEvent(new CustomEvent("nexbank_notification_updated"));
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    await dismissNotification(id);
    const item = notifications.find((n) => n.id === id || n._id === id);
    if (item && !item.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
    window.dispatchEvent(new CustomEvent("nexbank_notification_updated"));
  };

  const handleTogglePref = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-drawer">
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header__title-wrap">
            <h3 className="notif-header__title">Notifications</h3>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount} new</span>
            )}
          </div>
          <button type="button" className="notif-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Toolbar */}
        <div className="notif-toolbar">
          <button
            type="button"
            className="notif-mark-read-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>

          <button
            type="button"
            className="notif-prefs-toggle-btn"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            {showPreferences ? "Close Settings" : "Preferences"}
          </button>
        </div>

        {/* Optional Preferences Panel */}
        {showPreferences && (
          <div className="notif-preferences-panel">
            <div className="notif-prefs-title">Notification Channels &amp; Alerts</div>
            <div className="notif-toggle-row">
              <span className="notif-toggle-label">Budget Threshold Warnings (80% / 100%)</span>
              <label className="notif-switch" aria-label="Toggle budget threshold warnings">
                <input
                  type="checkbox"
                  checked={preferences.budgetAlerts}
                  onChange={() => handleTogglePref("budgetAlerts")}
                />
                <span className="notif-slider" />
              </label>
            </div>
            <div className="notif-toggle-row">
              <span className="notif-toggle-label">Upcoming Bill Reminders</span>
              <label className="notif-switch" aria-label="Toggle upcoming bill reminders">
                <input
                  type="checkbox"
                  checked={preferences.billReminders}
                  onChange={() => handleTogglePref("billReminders")}
                />
                <span className="notif-slider" />
              </label>
            </div>
            <div className="notif-toggle-row">
              <span className="notif-toggle-label">Security &amp; Device Notices</span>
              <label className="notif-switch" aria-label="Toggle security and device notices">
                <input
                  type="checkbox"
                  checked={preferences.securityNotices}
                  onChange={() => handleTogglePref("securityNotices")}
                />
                <span className="notif-slider" />
              </label>
            </div>
          </div>
        )}

        {/* Notifications Scroll List */}
        <div className="notif-list">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const notifId = n.id || n._id;
              const typeClass = `notif-item__icon--${n.type || "activity"}`;

              return (
                <div
                  key={notifId}
                  className={`notif-item ${!n.isRead ? "notif-item--unread" : ""}`}
                  onClick={(e) => !n.isRead && handleMarkItemRead(notifId, e)}
                >
                  <div className={`notif-item__icon ${typeClass}`}>
                    {n.type === "budget_warning" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : n.type === "bill_reminder" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : n.type === "security" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    ) : n.type === "goal_reminder" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    )}
                  </div>

                  <div className="notif-item__content">
                    <h4 className="notif-item__title">{n.title}</h4>
                    <p className="notif-item__message">{n.message}</p>
                    <span className="notif-item__time">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"}
                    </span>
                  </div>

                  {!n.isRead && <span className="notif-item__unread-dot" title="Unread" />}

                  <button
                    type="button"
                    className="notif-item__dismiss"
                    onClick={(e) => handleDismiss(notifId, e)}
                    title="Dismiss notification"
                  >
                    &times;
                  </button>
                </div>
              );
            })
          ) : (
            <div className="chart-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p>No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationDrawer;
