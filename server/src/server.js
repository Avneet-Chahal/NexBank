import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load environment variables from .env
dotenv.config();

// Database configuration import
import { connectDB, disconnectDB } from "./config/db.js";

// Middleware imports
import { requestLogger } from "./middleware/loggerMiddleware.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

// Route imports
import healthRoutes from "./routes/healthRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import savingsRoutes from "./routes/savingsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";

// Initialize Express Application
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Determine directory paths using modern ES module standard
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// 1. Core Global Middleware Pipeline
// =============================================================================

// Cross-Origin Resource Sharing (CORS) configured for the Vite frontend
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Built-in Body Parsing Middleware (JSON & URL-Encoded)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Custom Request Logger Middleware
app.use(requestLogger);

// Static file serving for user uploads (avatars)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// =============================================================================
// 2. Modular API Route Mounting
// =============================================================================

// Root welcome endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to NexBank Core Banking API",
    version: "1.0.0",
    docs: {
      health: "/api/health",
      accountSummary: "/api/accounts/summary",
      transactions: "/api/transactions",
      auth: "/api/auth",
      usersMe: "/api/users/me"
    },
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
app.use("/api/health", healthRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", savingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/cards", cardRoutes);

// =============================================================================
// 3. Error Handling Middleware
// =============================================================================

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// =============================================================================
// 4. Server Initialization & Non-Blocking HTTP Listener
// =============================================================================

import User from "./models/User.js";

async function seedDefaultUserIfMissing() {
  try {
    const existing = await User.findOne({ email: "demo@nexbank.com" });
    if (!existing) {
      await User.create({
        name: "Demo Customer",
        email: "demo@nexbank.com",
        password: "Demo@123",
        accountNumber: "NB8577145",
        accountType: "Premier Checking Account",
        balance: 84250.75,
        currency: "INR",
        mobile: "9876543210",
        avatar: "DC",
        accountStatus: "Active"
      });
      console.log("[DATABASE] Default demo customer (demo@nexbank.com) created in MongoDB Atlas.");
    }
  } catch (err) {
    console.warn("[DATABASE] Note on demo user initialization:", err.message);
  }
}

// Initialize goal reminder scheduler for 10-day milestone notifications
import { startGoalReminderScheduler, stopGoalReminderScheduler } from "./services/goalReminderScheduler.js";

// Connect to MongoDB Atlas (safe asynchronous connection initialization)
connectDB().then((connected) => {
  if (connected) {
    seedDefaultUserIfMissing();
  }
  // Start background goal reminder milestone processing
  startGoalReminderScheduler();
});

const server = app.listen(PORT, () => {
  console.log("=================================================");
  console.log(` NexBank Core Express Server Running`);
  console.log(` Port:        http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(` Allowed CORS Origin: ${CLIENT_ORIGIN}`);
  console.log(` Health:      http://localhost:${PORT}/api/health`);
  console.log(` Summary:     http://localhost:${PORT}/api/accounts/summary`);
  console.log(` Transactions:http://localhost:${PORT}/api/transactions`);
  console.log("=================================================");
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n[SHUTDOWN] Received SIGINT. Closing HTTP server & database connection...");
  stopGoalReminderScheduler();
  await disconnectDB();
  server.close(() => {
    console.log("[SHUTDOWN] NexBank server terminated cleanly.");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\n[SHUTDOWN] Received SIGTERM. Closing HTTP server & database connection...");
  stopGoalReminderScheduler();
  await disconnectDB();
  server.close(() => {
    console.log("[SHUTDOWN] NexBank server terminated cleanly.");
    process.exit(0);
  });
});

export default app;
