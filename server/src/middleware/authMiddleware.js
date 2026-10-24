import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { findUserById, sanitizeUser } from "../data/userStore.js";
import User from "../models/User.js";
import { isDbConnected } from "../config/db.js";

/**
 * JWT Authentication Guard Middleware
 * 
 * Verifies Authorization: Bearer <token>
 * Attaches sanitized user to req.user (via Mongoose User or UserStore)
 * Returns HTTP 401 for missing, malformed, or invalid tokens
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Missing Authorization header
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: "Unauthorized: Missing Authorization header. Access denied.",
        statusCode: 401
      },
      timestamp: new Date().toISOString()
    });
  }

  // 2. Malformed token structure (must be "Bearer <token>")
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      success: false,
      error: {
        message: "Unauthorized: Malformed Authorization header. Expected format: 'Bearer <token>'.",
        statusCode: 401
      },
      timestamp: new Date().toISOString()
    });
  }

  const token = parts[1];

  // 3. Verify JWT signature with secret from environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    const error = new Error("Server Misconfiguration: JWT_SECRET environment variable is missing.");
    error.statusCode = 500;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // 4. Locate user by decoded ID (checks Mongoose User model first if DB connected)
    let user = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const dbUser = await User.findById(decoded.id);
      if (dbUser) {
        user = dbUser.toJSON();
      }
    }

    if (!user) {
      const storeUser = findUserById(decoded.id);
      if (storeUser) {
        user = sanitizeUser(storeUser);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized: User session no longer exists.",
          statusCode: 401
        },
        timestamp: new Date().toISOString()
      });
    }

    // Attach sanitized user to request (never exposes password or passwordHash)
    req.user = user;
    next();
  } catch (err) {
    let message = "Unauthorized: Invalid or corrupted authentication token.";
    if (err.name === "TokenExpiredError") {
      message = "Unauthorized: Authentication token has expired. Please log in again.";
    }

    return res.status(401).json({
      success: false,
      error: {
        message: message,
        statusCode: 401,
        tokenError: err.name
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid Bearer token is present, but allows unauthenticated access if absent
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return next();

  const token = parts[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return next();

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(decoded.id)) {
      const dbUser = await User.findById(decoded.id);
      if (dbUser) {
        req.user = dbUser.toJSON();
        return next();
      }
    }

    const storeUser = findUserById(decoded.id);
    if (storeUser) {
      req.user = sanitizeUser(storeUser);
    }
    next();
  } catch {
    next();
  }
}
