import { Router } from "express";
import mongoose from "mongoose";
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from "../data/transactionStore.js";
import { Transaction } from "../models/Transaction.js";
import { isDbConnected } from "../config/db.js";
import {
  validateTransactionId,
  validateTransactionCreate,
  validateTransactionUpdate
} from "../middleware/transactionValidation.js";
import { optionalAuth, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Default customer scope for unauthenticated demo baseline
const DEFAULT_CUSTOMER_ID = "NX-8801";

/**
 * Helper to determine current customer identifier (from JWT if available, else default)
 */
function getActiveUserId(req) {
  if (req.user) {
    return req.user._id ? req.user._id.toString() : req.user.id;
  }
  return DEFAULT_CUSTOMER_ID;
}

/**
 * @route   GET /api/transactions
 * @desc    Retrieve transactions scoped to the authenticated customer
 * @access  Public / Authenticated
 * Demonstrates:
 * - Query parameter processing (type, search, sortBy)
 * - Mongoose CRUD (Read) & Mongoose populate('user')
 * - User data scoping (only returns data belonging to authenticated user)
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { type, search, sortBy } = req.query;
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const filter = { user: req.user._id || req.user.id };

      if (type && type !== "all") {
        filter.type = type.toLowerCase();
      }

      if (search && search.trim()) {
        const query = search.trim();
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } }
        ];
      }

      const sortOptions = {};
      if (sortBy === "oldest") sortOptions.date = 1;
      else if (sortBy === "highest") sortOptions.amount = -1;
      else if (sortBy === "lowest") sortOptions.amount = 1;
      else sortOptions.date = -1; // newest first

      // Demonstrates Mongoose populate() referencing User model
      const dbRecords = await Transaction.find(filter)
        .populate("user", "name email accountNumber accountType balance")
        .sort(sortOptions);

      return res.status(200).json({
        success: true,
        count: dbRecords.length,
        source: "MongoDB Atlas",
        data: dbRecords,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const records = getAllTransactions({
      type,
      search,
      sortBy,
      userId: currentUserId
    });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Retrieve single transaction record by ID
 * @access  Public / Authenticated
 * Demonstrates:
 * - Safe identifier handling (Mongoose ObjectId and custom format)
 * - Mongoose populate('user')
 * - 404 Not Found handling
 */
router.get("/:id", optionalAuth, validateTransactionId, async (req, res, next) => {
  try {
    const id = req.validatedId;
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const userId = req.user._id || req.user.id;
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId
        ? { _id: id, user: userId }
        : { transactionId: id.toUpperCase(), user: userId };

      // Demonstrates Mongoose populate()
      const dbTx = await Transaction.findOne(query).populate(
        "user",
        "name email accountNumber accountType"
      );

      if (!dbTx) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Transaction record '${id}' was not found.`,
            statusCode: 404,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        source: "MongoDB Atlas",
        data: dbTx,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const transaction = getTransactionById(id, currentUserId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Transaction record '${id}' was not found.`,
          statusCode: 404,
          id
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction record referencing the customer account
 * @access  Private (Requires Bearer token)
 * Demonstrates:
 * - Mongoose document creation with User reference
 * - Mongoose populate('user')
 * - HTTP 201 Created status and Location header
 */
router.post("/", requireAuth, validateTransactionCreate, async (req, res, next) => {
  try {
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const userId = req.user._id || req.user.id;
      const uniqueSuffix = `${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const transactionId = `TX-${uniqueSuffix}`;

      const createdTx = await Transaction.create({
        user: userId,
        transactionId: transactionId,
        title: req.validatedBody.title,
        category: req.validatedBody.category,
        type: req.validatedBody.type,
        amount: req.validatedBody.amount,
        paymentMethod: req.validatedBody.paymentMethod || "Debit Card",
        description: req.validatedBody.description || "",
        date: req.validatedBody.date ? new Date(req.validatedBody.date) : new Date(),
        status: "Completed"
      });

      // Populate user reference
      await createdTx.populate("user", "name email accountNumber accountType");

      res.setHeader("Location", `/api/transactions/${createdTx._id}`);
      return res.status(201).json({
        success: true,
        message: "Transaction created successfully in MongoDB.",
        source: "MongoDB Atlas",
        data: createdTx,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const newRecord = createTransaction(req.validatedBody, currentUserId);

    res.setHeader("Location", `/api/transactions/${newRecord.id}`);
    res.status(201).json({
      success: true,
      message: "Transaction record created successfully.",
      data: newRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/transactions/:id
 * @desc    Update an existing transaction record with Mongoose
 * @access  Private (Requires Bearer token)
 */
router.patch("/:id", requireAuth, validateTransactionId, validateTransactionUpdate, async (req, res, next) => {
  try {
    const id = req.validatedId;
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const userId = (req.user._id || req.user.id).toString();
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const idQuery = isObjectId ? { _id: id } : { transactionId: id.toUpperCase() };

      const existingTx = await Transaction.findOne(idQuery);
      if (!existingTx) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Cannot update: Transaction record '${id}' was not found.`,
            statusCode: 404,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      // Enforce ownership: users may only modify their own transactions
      if (existingTx.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "Access Denied: You do not have permission to modify another user's transaction.",
            statusCode: 403,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      const { id: _, userId: __, balance: ___, accountBalance: ____, ...allowedUpdates } = req.body;

      const updated = await Transaction.findOneAndUpdate(idQuery, allowedUpdates, {
        new: true,
        runValidators: true
      }).populate("user", "name email accountNumber accountType");

      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully in MongoDB.",
        data: updated,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const updatedRecord = updateTransaction(id, req.body, currentUserId);

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Cannot update: Transaction record '${id}' was not found.`,
          statusCode: 404,
          id
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction record updated successfully.",
      data: updatedRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/transactions/:id
 * @desc    Full update alias
 * @access  Private (Requires Bearer token)
 */
router.put("/:id", requireAuth, validateTransactionId, validateTransactionUpdate, async (req, res, next) => {
  try {
    const id = req.validatedId;
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const userId = (req.user._id || req.user.id).toString();
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const idQuery = isObjectId ? { _id: id } : { transactionId: id.toUpperCase() };

      const existingTx = await Transaction.findOne(idQuery);
      if (!existingTx) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Cannot update: Transaction record '${id}' was not found.`,
            statusCode: 404,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      // Enforce ownership: users may only modify their own transactions
      if (existingTx.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "Access Denied: You do not have permission to modify another user's transaction.",
            statusCode: 403,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      const { id: _, userId: __, balance: ___, accountBalance: ____, ...allowedUpdates } = req.body;

      const updated = await Transaction.findOneAndUpdate(idQuery, allowedUpdates, {
        new: true,
        runValidators: true
      }).populate("user", "name email accountNumber accountType");

      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully in MongoDB.",
        data: updated,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const updatedRecord = updateTransaction(id, req.body, currentUserId);

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Cannot update: Transaction record '${id}' was not found.`,
          statusCode: 404,
          id
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction record updated successfully.",
      data: updatedRecord,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction record
 * @access  Private (Requires Bearer token)
 */
router.delete("/:id", requireAuth, validateTransactionId, async (req, res, next) => {
  try {
    const id = req.validatedId;
    const currentUserId = getActiveUserId(req);

    // A. When MongoDB Atlas is connected
    if (isDbConnected() && req.user && (req.user._id || req.user.id)) {
      const userId = (req.user._id || req.user.id).toString();
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const idQuery = isObjectId ? { _id: id } : { transactionId: id.toUpperCase() };

      const existingTx = await Transaction.findOne(idQuery);
      if (!existingTx) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Cannot delete: Transaction record '${id}' was not found.`,
            statusCode: 404,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      // Enforce ownership: users may only delete their own transactions
      if (existingTx.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: "Access Denied: You do not have permission to delete another user's transaction.",
            statusCode: 403,
            id
          },
          timestamp: new Date().toISOString()
        });
      }

      await Transaction.findOneAndDelete(idQuery);

      return res.status(200).json({
        success: true,
        message: `Transaction record '${id}' has been permanently deleted from MongoDB.`,
        deletedId: id,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development Store Fallback
    const deleted = deleteTransaction(id, currentUserId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Cannot delete: Transaction record '${id}' was not found.`,
          statusCode: 404,
          id
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: `Transaction record '${id}' has been permanently deleted.`,
      deletedId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
