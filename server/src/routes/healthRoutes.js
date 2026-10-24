import { Router } from "express";
import { isDbConnected } from "../config/db.js";

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health-check endpoint including MongoDB Atlas connection status
 * @access  Public
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NexBank Core API is fully operational",
    data: {
      service: "nexbank-server",
      status: "HEALTHY",
      database: isDbConnected() ? "Connected (MongoDB Atlas)" : "Offline / Resilient Fallback",
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      clientIp: req.ip || req.socket.remoteAddress
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
