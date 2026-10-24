import { Router } from "express";
import { Card } from "../models/Card.js";
import { isDbConnected } from "../config/db.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import { getUserCard, updateCardSettings } from "../data/cardStore.js";

const router = Router();
const DEFAULT_CUSTOMER_ID = "NX-8801";

function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/cards
 * @desc    Retrieve virtual debit card details & control settings
 * @access  Public / Authenticated
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);
    const userName = req.user ? req.user.name : "Demo Customer";

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      let dbCard = await Card.findOne({ user: req.user._id });
      if (!dbCard) {
        dbCard = await Card.create({
          user: req.user._id,
          cardHolder: userName
        });
      }

      return res.status(200).json({
        success: true,
        source: "MongoDB Atlas",
        data: dbCard,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const card = getUserCard(currentUserId, userName);
    res.status(200).json({
      success: true,
      source: "Development In-Memory Store",
      data: card,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/cards/settings
 * @desc    Update card controls (freeze/unfreeze, limit, contactless, international)
 * @access  Private
 */
router.patch("/settings", requireAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);
    const {
      isFrozen,
      monthlyLimit,
      contactlessEnabled,
      internationalEnabled,
      onlineTransactionsEnabled
    } = req.body;

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const updates = {};
      if (isFrozen !== undefined) updates.isFrozen = Boolean(isFrozen);
      if (monthlyLimit !== undefined) updates.monthlyLimit = Number(monthlyLimit);
      if (contactlessEnabled !== undefined) updates.contactlessEnabled = Boolean(contactlessEnabled);
      if (internationalEnabled !== undefined) updates.internationalEnabled = Boolean(internationalEnabled);
      if (onlineTransactionsEnabled !== undefined) updates.onlineTransactionsEnabled = Boolean(onlineTransactionsEnabled);

      const dbCard = await Card.findOneAndUpdate(
        { user: req.user._id },
        updates,
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Virtual card security settings updated in MongoDB.",
        data: dbCard,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const updated = updateCardSettings(currentUserId, req.body);
    res.status(200).json({
      success: true,
      message: "Virtual card security settings updated successfully.",
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
