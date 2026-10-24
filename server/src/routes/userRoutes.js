import { Router } from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { requireAuth } from "../middleware/authMiddleware.js";
import { handleAvatarUpload, UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";
import { updateUserAvatar, changeUserPassword, getUserSecurityEvents } from "../data/userStore.js";
import bcrypt from "bcryptjs";

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Protected endpoint returning the authenticated customer's profile
 * @access  Private (Requires valid JWT Bearer token)
 */
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated profile accessed successfully.",
    data: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/users/avatar
 * @desc    Upload and update customer profile avatar image using Multer
 * @access  Private (Requires valid JWT Bearer token)
 * Demonstrates:
 * - Multer multipart/form-data upload handling
 * - Magic byte inspection & file size limits (<= 2MB)
 * - Safe server-side randomized filename generation
 * - Overwriting prevention until validated (staged in memory first)
 * - Zero exposure of server filesystem paths
 */
router.post("/avatar", requireAuth, handleAvatarUpload, async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const ext = req.verifiedImageExtension || "jpg";

    // Generate safe, randomized server-side filename (never trust original name)
    const randomHex = crypto.randomBytes(6).toString("hex");
    const safeFilename = `avatar-${userId}-${Date.now()}-${randomHex}.${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, safeFilename);

    // Save validated file to disk
    await fs.promises.writeFile(destinationPath, req.file.buffer);

    // Public URL path (relative route served statically, never exposes internal OS paths)
    const publicAvatarUrl = `/uploads/avatars/${safeFilename}`;

    // Previous avatar to clean up if it was a custom upload
    const previousAvatar = req.user.avatar;

    let updatedUser = null;

    // A. Update in MongoDB if connected
    if (isDbConnected() && req.user._id) {
      const dbUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: publicAvatarUrl },
        { new: true, runValidators: true }
      );
      if (dbUser) {
        updatedUser = dbUser.toJSON();
      }
    }

    // B. Fallback store update
    if (!updatedUser) {
      updatedUser = updateUserAvatar(userId, publicAvatarUrl) || {
        ...req.user,
        avatar: publicAvatarUrl
      };
    }

    // Clean up old avatar file from disk if it was an uploaded file
    if (
      previousAvatar &&
      typeof previousAvatar === "string" &&
      previousAvatar.startsWith("/uploads/avatars/")
    ) {
      const oldFilename = path.basename(previousAvatar);
      const oldPath = path.join(UPLOAD_DIR, oldFilename);
      if (oldPath !== destinationPath && fs.existsSync(oldPath)) {
        fs.promises.unlink(oldPath).catch((err) => {
          console.warn(`Could not remove previous avatar file: ${err.message}`);
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile image uploaded and updated successfully.",
      data: {
        avatar: publicAvatarUrl,
        user: updatedUser
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/change-password
 * @desc    Verify current password with bcrypt and update to new bcrypt-hashed password
 * @access  Private (Requires valid JWT Bearer token)
 */
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: "Both current password and new password are required.", statusCode: 400 }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: "New password must be at least 8 characters long.", statusCode: 400 }
      });
    }

    // MongoDB Atlas
    if (isDbConnected() && req.user._id) {
      const user = await User.findById(req.user._id).select("+password");
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: "User account not found.", statusCode: 404 }
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { message: "Current password does not match our records.", statusCode: 401 }
        });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Your password has been changed successfully in MongoDB.",
        timestamp: new Date().toISOString()
      });
    }

    // In-memory fallback
    const result = await changeUserPassword(userId, currentPassword, newPassword);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: { message: result.message || "Invalid current password.", statusCode: 401 }
      });
    }

    res.status(200).json({
      success: true,
      message: "Your password has been changed successfully.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/security-events
 * @desc    Retrieve security activity log for the customer account
 * @access  Private
 */
router.get("/security-events", requireAuth, (req, res) => {
  const userId = req.user._id ? req.user._id.toString() : req.user.id;
  const events = getUserSecurityEvents(userId);
  res.status(200).json({
    success: true,
    data: events,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   PUT /api/users/me
 * @desc    Update basic user profile details (Name, Mobile)
 * @access  Private
 */
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, mobile } = req.body;
    let updatedUser = { ...req.user };

    if (name) updatedUser.name = name.trim();
    if (mobile) updatedUser.mobile = mobile.trim();

    if (isDbConnected() && req.user._id) {
      const dbUser = await User.findByIdAndUpdate(
        req.user._id,
        { name: updatedUser.name, mobile: updatedUser.mobile },
        { new: true, runValidators: true }
      );
      if (dbUser) updatedUser = dbUser.toJSON();
    }

    res.status(200).json({
      success: true,
      message: "Profile details updated successfully.",
      data: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
