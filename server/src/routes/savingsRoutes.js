import { Router } from "express";
import mongoose from "mongoose";
import { SavingsGoal } from "../models/SavingsGoal.js";
import { isDbConnected } from "../config/db.js";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  getUserGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal
} from "../data/savingsStore.js";

const router = Router();
const DEFAULT_CUSTOMER_ID = "NX-8801";

function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/goals
 * @desc    Retrieve savings goals for authenticated customer
 * @access  Public / Authenticated
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const dbGoals = await SavingsGoal.find({ user: req.user._id }).sort({ targetDate: 1 });
      return res.status(200).json({
        success: true,
        count: dbGoals.length,
        source: "MongoDB Atlas",
        data: dbGoals,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const items = getUserGoals(currentUserId);
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
 * @route   POST /api/goals
 * @desc    Create a new savings goal
 * @access  Private
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, targetAmount, savedAmount, targetDate, category } = req.body;
    const currentUserId = getActiveUserId(req);

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Goal name is required.", statusCode: 400 }
      });
    }

    const target = Number(targetAmount);
    if (isNaN(target) || target <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Target amount must be a positive number.", statusCode: 400 }
      });
    }

    if (!targetDate) {
      return res.status(400).json({
        success: false,
        error: { message: "Target completion date is required.", statusCode: 400 }
      });
    }

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const created = await SavingsGoal.create({
        user: req.user._id,
        name: name.trim(),
        targetAmount: target,
        savedAmount: Number(savedAmount || 0),
        targetDate: new Date(targetDate),
        category: (category || "General").trim(),
        isCompleted: Number(savedAmount || 0) >= target
      });

      return res.status(201).json({
        success: true,
        message: "Savings goal created in MongoDB.",
        data: created,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const newGoal = createGoal(
      {
        name: name.trim(),
        targetAmount: target,
        savedAmount: Number(savedAmount || 0),
        targetDate,
        category: (category || "General").trim()
      },
      currentUserId
    );

    res.status(201).json({
      success: true,
      message: "Savings goal created successfully.",
      data: newGoal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/goals/:id/contribute
 * @desc    Add or remove demo contribution from a savings goal
 * @access  Private
 */
router.post("/:id/contribute", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const currentUserId = getActiveUserId(req);

    const delta = Number(amount);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Contribution amount must be a non-zero number.", statusCode: 400 }
      });
    }

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id } : { id };

      const goal = await SavingsGoal.findOne(query);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { message: `Goal '${id}' not found.`, statusCode: 404 }
        });
      }

      if (goal.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: "Access Denied: You do not own this savings goal.", statusCode: 403 }
        });
      }

      const newSaved = Math.max(0, goal.savedAmount + delta);
      goal.savedAmount = newSaved;
      goal.isCompleted = newSaved >= goal.targetAmount;
      await goal.save();

      return res.status(200).json({
        success: true,
        message: `Simulated demo contribution of ${delta > 0 ? "+" : ""}${delta} processed.`,
        data: goal,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const updated = contributeToGoal(id, delta, currentUserId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Goal '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      message: `Simulated demo contribution of ${delta > 0 ? "+" : ""}${delta} processed.`,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/goals/:id
 * @desc    Update a savings goal
 * @access  Private
 */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getActiveUserId(req);

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id } : { id };

      const goal = await SavingsGoal.findOne(query);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { message: `Goal '${id}' not found.`, statusCode: 404 }
        });
      }

      if (goal.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: "Access Denied: You do not own this savings goal.", statusCode: 403 }
        });
      }

      const allowedFields = ["name", "targetAmount", "savedAmount", "targetDate", "category"];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          goal[field] = req.body[field];
        }
      });
      goal.isCompleted = goal.savedAmount >= goal.targetAmount;
      await goal.save();

      return res.status(200).json({
        success: true,
        message: "Goal updated successfully.",
        data: goal,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const updated = updateGoal(id, req.body, currentUserId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Goal '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      message: "Goal updated successfully.",
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a savings goal
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

      const goal = await SavingsGoal.findOne(query);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { message: `Goal '${id}' not found.`, statusCode: 404 }
        });
      }

      if (goal.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: "Access Denied: You do not own this savings goal.", statusCode: 403 }
        });
      }

      await SavingsGoal.findOneAndDelete(query);
      return res.status(200).json({
        success: true,
        message: `Goal '${id}' deleted successfully from MongoDB.`,
        deletedId: id,
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const deleted = deleteGoal(id, currentUserId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: `Goal '${id}' not found.`, statusCode: 404 }
      });
    }

    res.status(200).json({
      success: true,
      message: `Goal '${id}' deleted successfully.`,
      deletedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
