import { Router } from "express";
import fs from "fs";
import path from "path";
import { Readable, pipeline } from "stream";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAllTransactions } from "../data/transactionStore.js";
import { Transaction } from "../models/Transaction.js";
import { isDbConnected } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Read-only account summary data store
 * Represents core banking ledger state matching the existing NexBank Dashboard
 */
const ACCOUNT_SUMMARY_RECORD = {
  accountHolder: "Demo Customer",
  accountNumber: "NB8577145",
  accountType: "Savings Account",
  balance: 84250.75,
  currency: "INR",
  accountStatus: "Active",
  metrics: {
    totalIncome: 67000.0,
    totalExpenses: 9718.0,
    netSavings: 57282.0,
    availableBalance: 84250.75,
    expensePercentage: 14,
    savingsPercentage: 86
  },
  lastAuditTimestamp: new Date().toISOString()
};

/**
 * @route   GET /api/accounts/summary
 * @desc    Retrieve read-only account financial summary for the customer dashboard
 * @access  Public (Read-only baseline)
 */
router.get("/summary", async (req, res, next) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const requestedCurrency = req.query.currency || ACCOUNT_SUMMARY_RECORD.currency;

    const summaryData = {
      ...ACCOUNT_SUMMARY_RECORD,
      currency: requestedCurrency,
      retrievedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: "Account financial summary retrieved successfully",
      data: summaryData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/accounts/statement/export
 * @desc    Generate and stream authenticated user's transaction statement as CSV using Node.js stream pipeline
 * @access  Private (Scoped to authenticated user)
 */
router.get("/statement/export", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { from, to, type } = req.query;

    let userTransactions = [];

    // MongoDB Atlas
    if (isDbConnected() && req.user && req.user._id) {
      const query = { user: req.user._id };
      if (type && type !== "all") query.type = type.toLowerCase();
      if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to + "T23:59:59.999Z");
      }
      userTransactions = await Transaction.find(query).sort({ date: -1 });
    } else {
      // In-memory fallback
      userTransactions = getAllTransactions({
        userId,
        type: type && type !== "all" ? type : undefined,
        sortBy: "newest"
      });

      if (from || to) {
        const fromTs = from ? new Date(from).getTime() : null;
        const toTs = to ? new Date(to).setHours(23, 59, 59, 999) : null;
        userTransactions = userTransactions.filter((tx) => {
          const t = new Date(tx.date).getTime();
          if (fromTs && t < fromTs) return false;
          if (toTs && t > toTs) return false;
          return true;
        });
      }
    }

    // Set streaming headers
    const filename = `nexbank_statement_${userId}_${Date.now()}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Prepare CSV rows
    const headerRow = [
      "Transaction ID",
      "Date",
      "Description",
      "Category",
      "Type",
      "Amount (INR)",
      "Status"
    ];

    const csvLines = [headerRow.map(escapeCsvField).join(",") + "\r\n"];

    for (const tx of userTransactions) {
      const row = [
        tx.transactionId || tx.id,
        tx.date ? new Date(tx.date).toISOString().slice(0, 10) : "",
        tx.title || "",
        tx.category || "",
        tx.type ? tx.type.toUpperCase() : "EXPENSE",
        Number(tx.amount || 0).toFixed(2),
        tx.status || "Completed"
      ];
      csvLines.push(row.map(escapeCsvField).join(",") + "\r\n");
    }

    // Create Readable stream and pipe safely to HTTP response
    const stream = Readable.from(csvLines);

    pipeline(stream, res, (err) => {
      if (err) {
        if (!stream.destroyed) stream.destroy();
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Stream pipeline error while exporting statement",
            error: err.message
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/accounts/statement/sample
 * @desc    Stream sample account statement CSV using Node.js Readable stream and stream.pipeline()
 * @access  Public (Demonstrates Topic 26: Node.js Streams with sample data)
 */
router.get("/statement/sample", (req, res, next) => {
  const statementPath = path.resolve(__dirname, "../data/sample_statement.csv");

  if (!fs.existsSync(statementPath)) {
    return res.status(404).json({
      success: false,
      message: "Sample statement file not found"
    });
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="nexbank_sample_statement.csv"'
  );

  const readStream = fs.createReadStream(statementPath);

  pipeline(readStream, res, (err) => {
    if (err) {
      if (!readStream.destroyed) {
        readStream.destroy();
      }
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Stream pipeline error occurred while downloading statement",
          error: err.message
        });
      }
    }
  });
});

export default router;

