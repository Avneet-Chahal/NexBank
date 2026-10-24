import { Router } from "express";
import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { isDbConnected } from "../config/db.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../data/notificationStore.js";

const router = Router();
const DEFAULT_CUSTOMER_ID = "NX-8801";

function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/notifications
 * @desc    Retrieve notifications for authenticated customer
 * @access  Public / Authenticated
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const dbNotifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
      const unreadCount = dbNotifs.filter((n) => !n.isRead).length;

      return res.status(200).json({
        success: true,
        count: dbNotifs.length,
        unreadCount,
        source: "MongoDB Atlas",
        data: dbNotifs,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const items = getUserNotifications(currentUserId);
    const unreadCount = items.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: items.length,
      unreadCount,
      source: "Development In-Memory Store",
      data: items,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id, user: req.user._id } : { id };

      const updated = await Notification.findOneAndUpdate(
        query,
        { isRead: true },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        data: updated,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const item = markAsRead(id, currentUserId);
    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: item,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all customer notifications as read
 * @access  Private
 */
router.patch("/mark-all-read", requireAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    markAllAsRead(currentUserId);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Dismiss / delete a notification
 * @access  Private
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id, user: req.user._id } : { id };

      await Notification.findOneAndDelete(query);
      return res.status(200).json({
        success: true,
        message: "Notification dismissed successfully.",
        deletedId: id,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    deleteNotification(id, currentUserId);
    res.status(200).json({
      success: true,
      message: "Notification dismissed successfully.",
      deletedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
