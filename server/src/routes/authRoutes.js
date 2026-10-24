import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  sanitizeUser
} from "../data/userStore.js";
import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";
import {
  validateRegisterInput,
  validateLoginInput
} from "../middleware/authValidation.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Signs a JSON Web Token (JWT) with standard claims and expiry
 * 
 * @param {object} user - User record (id / _id, email)
 * @returns {string} Signed JWT string
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in server environment.");
  }

  const userId = user._id ? user._id.toString() : user.id;
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(
    {
      id: userId,
      email: user.email
    },
    secret,
    { expiresIn }
  );
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account with MongoDB/Mongoose or UserStore
 * @access  Public
 */
router.post("/register", validateRegisterInput, async (req, res, next) => {
  try {
    const { fullName, email, password, mobile, accountType } = req.validatedRegister;

    // A. When MongoDB Atlas is connected
    if (isDbConnected()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            message: "An account with this email address already exists. Please sign in instead.",
            statusCode: 409,
            field: "email"
          },
          timestamp: new Date().toISOString()
        });
      }

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const accountNumber = `NB${randomSuffix}`;
      const avatar = fullName
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "NX";

      // Mongoose User.create() automatically triggers pre-save bcrypt password hashing
      const newDbUser = await User.create({
        name: fullName,
        email,
        password,
        mobile,
        accountNumber,
        accountType: accountType || "Savings Account",
        avatar,
        balance: accountType && accountType.toLowerCase().includes("current") ? 3500.0 : 1500.0,
        currency: "INR"
      });

      const sanitized = newDbUser.toJSON();
      const token = generateToken(sanitized);

      return res.status(201).json({
        success: true,
        message: "Your NexBank account has been created successfully in MongoDB.",
        token,
        user: sanitized,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development fallback
    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          message: "An account with this email address already exists. Please sign in instead.",
          statusCode: 409,
          field: "email"
        },
        timestamp: new Date().toISOString()
      });
    }

    const newUser = await createUser({
      fullName,
      email,
      password,
      mobile,
      accountType
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Your NexBank account has been created successfully.",
      token,
      user: newUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate customer credentials and issue JWT
 * @access  Public
 */
router.post("/login", validateLoginInput, async (req, res, next) => {
  try {
    const { email, password } = req.validatedLogin;

    // A. When MongoDB Atlas is connected
    if (isDbConnected()) {
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: "Invalid email or password. Please verify your credentials.",
            statusCode: 401
          },
          timestamp: new Date().toISOString()
        });
      }

      if (user.accountStatus !== "Active") {
        return res.status(403).json({
          success: false,
          error: {
            message: "Your NexBank account is deactivated or suspended. Please contact support.",
            statusCode: 403
          },
          timestamp: new Date().toISOString()
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            message: "Invalid email or password. Please verify your credentials.",
            statusCode: 401
          },
          timestamp: new Date().toISOString()
        });
      }

      const sanitized = user.toJSON();
      const token = generateToken(sanitized);

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${sanitized.name}! Sign in successful.`,
        token,
        user: sanitized,
        timestamp: new Date().toISOString()
      });
    }

    // B. Development fallback
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid email or password. Please verify your credentials.",
          statusCode: 401
        },
        timestamp: new Date().toISOString()
      });
    }

    if (user.accountStatus !== "Active") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Your NexBank account is deactivated or suspended. Please contact support.",
          statusCode: 403
        },
        timestamp: new Date().toISOString()
      });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid email or password. Please verify your credentials.",
          statusCode: 401
        },
        timestamp: new Date().toISOString()
      });
    }

    const sanitizedUser = sanitizeUser(user);
    const token = generateToken(sanitizedUser);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${sanitizedUser.name}! Sign in successful.`,
      token,
      user: sanitizedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve currently authenticated user profile
 * @access  Private (Bearer JWT)
 */
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated customer session verified.",
    data: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;
