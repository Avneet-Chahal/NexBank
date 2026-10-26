import { Router } from "express";
import mongoose from "mongoose";
import { SupportTicket } from "../models/SupportTicket.js";
import { isDbConnected } from "../config/db.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserTickets,
  getTicketById,
  createTicket
} from "../data/ticketStore.js";
import { Notification } from "../models/Notification.js";
import { createNotification } from "../data/notificationStore.js";

const router = Router();
const DEFAULT_CUSTOMER_ID = "NX-8801";

function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/tickets
 * @desc    Retrieve customer's support tickets
 * @access  Public / Authenticated
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const dbTickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: dbTickets.length,
        source: "MongoDB Atlas",
        data: dbTickets,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const items = getUserTickets(currentUserId);
    res.status(200).json({
      success: true,
      count: items.length,
      source: "Development In-Memory Store",
      data: items,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/tickets
 * @desc    Submit a new customer support ticket
 * @access  Private
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { category, subject, description, transactionReference, priority } = req.body;
    const currentUserId = getActiveUserId(req);

    if (!category || typeof category !== "string") {
      return res.status(400).json({
        success: false,
        error: { message: "Please select an issue category.", statusCode: 400 }
      });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Subject line is required.", statusCode: 400 }
      });
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Detailed issue description is required.", statusCode: 400 }
      });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-2026-${randomSuffix}`;

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const created = await SupportTicket.create({
        user: req.user._id,
        ticketId,
        category: category.trim(),
        subject: subject.trim(),
        description: description.trim(),
        transactionReference: transactionReference ? transactionReference.trim() : null,
        priority: priority || "Normal",
        status: "Open"
      });

      // Create in-app notification confirming ticket submission
      try {
        const ticketRef = created.ticketId ? ` (ID: ${created.ticketId})` : "";
        await Notification.create({
          user: req.user._id,
          title: "Support Ticket Submitted",
          message: `Your support ticket '${created.subject}' has been submitted successfully${ticketRef}. Our team will review it.`,
          type: "activity",
          isRead: false
        });
      } catch (notifErr) {
        // Notification failure must not falsely report ticket submission failure
        console.error("[TICKETS] Failed to create in-app notification (handled gracefully):", notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: "Support ticket registered successfully.",
        data: created,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const newTicket = createTicket(
      {
        category,
        subject,
        description,
        transactionReference,
        priority
      },
      currentUserId
    );

    try {
      const ticketRef = newTicket.id ? ` (ID: ${newTicket.id})` : "";
      createNotification(
        {
          title: "Support Ticket Submitted",
          message: `Your support ticket '${newTicket.subject}' has been submitted successfully${ticketRef}. Our team will review it.`,
          type: "activity"
        },
        currentUserId
      );
    } catch (notifErr) {
      console.error("[TICKETS] In-memory notification creation error (handled gracefully):", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Support ticket registered successfully.",
      data: newTicket,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/tickets/:id
 * @desc    Retrieve single support ticket details
 * @access  Private
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id, user: req.user._id } : { ticketId: id.toUpperCase(), user: req.user._id };

      const ticket = await SupportTicket.findOne(query);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: { message: `Support ticket '${id}' not found.`, statusCode: 404 }
        });
      }

      return res.status(200).json({
        success: true,
        data: ticket,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const item = getTicketById(id, currentUserId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: `Support ticket '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
