import { Router } from "express";
import mongoose from "mongoose";
import { Budget } from "../models/Budget.js";
import { isDbConnected } from "../config/db.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from "../data/budgetStore.js";

const router = Router();
const DEFAULT_CUSTOMER_ID = "NX-8801";

function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/budgets
 * @desc    Retrieve monthly budgets for authenticated customer
 * @access  Public / Authenticated
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { month } = req.query;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const query = { user: req.user._id };
      if (month) query.month = month;

      const dbBudgets = await Budget.find(query).sort({ category: 1 });
      return res.status(200).json({
        success: true,
        count: dbBudgets.length,
        source: "MongoDB Atlas",
        data: dbBudgets,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const items = getUserBudgets(currentUserId, month);
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
 * @route   POST /api/budgets
 * @desc    Create or update a category budget for a month
 * @access  Private
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { category, amount, month } = req.body;
    const currentUserId = getActiveUserId(req);

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Budget category is required.", statusCode: 400 }
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Budget amount must be a positive number.", statusCode: 400 }
      });
    }

    const cleanMonth = (month || new Date().toISOString().slice(0, 7)).trim();

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const budget = await Budget.findOneAndUpdate(
        { user: req.user._id, category: category.trim(), month: cleanMonth },
        { amount: numericAmount, currency: "INR" },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(201).json({
        success: true,
        message: "Budget plan saved successfully in MongoDB.",
        data: budget,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const saved = createBudget(
      { category: category.trim(), amount: numericAmount, month: cleanMonth },
      currentUserId
    );

    res.status(201).json({
      success: true,
      message: "Budget plan saved successfully.",
      data: saved,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/budgets/:id
 * @desc    Update budget amount or category
 * @access  Private
 */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, category, month } = req.body;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id } : { id };

      const existing = await Budget.findOne(query);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: `Budget record '${id}' not found.`, statusCode: 404 }
        });
      }

      if (existing.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: "Access Denied: You do not own this budget.", statusCode: 403 }
        });
      }

      const updates = {};
      if (amount !== undefined) updates.amount = Number(amount);
      if (category !== undefined) updates.category = category.trim();
      if (month !== undefined) updates.month = month.trim();

      const updated = await Budget.findOneAndUpdate(query, updates, { new: true, runValidators: true });
      return res.status(200).json({
        success: true,
        message: "Budget updated successfully.",
        data: updated,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const updated = updateBudget(id, req.body, currentUserId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Budget record '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete category budget
 * @access  Private
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id } : { id };

      const existing = await Budget.findOne(query);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: `Budget record '${id}' not found.`, statusCode: 404 }
        });
      }

      if (existing.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: "Access Denied: You do not own this budget.", statusCode: 403 }
        });
      }

      await Budget.findOneAndDelete(query);
      return res.status(200).json({
        success: true,
        message: `Budget '${id}' deleted successfully from MongoDB.`,
        deletedId: id,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const deleted = deleteBudget(id, currentUserId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: `Budget record '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      message: `Budget '${id}' deleted successfully.`,
      deletedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
