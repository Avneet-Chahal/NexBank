import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * NexBank – Mongoose Customer User Schema
 * Demonstrates:
 * - Mongoose Schema definition & strict types
 * - Field-level validations (required, minlength, maxlength, regex match)
 * - Mongoose pre-save middleware hook for bcrypt password hashing
 * - Document instance methods (comparePassword)
 * - toJSON transformation to exclude password & internal fields
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false // Never returned in default queries
    },
    mobile: {
      type: String,
      trim: true,
      default: ""
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      unique: true,
      uppercase: true
    },
    accountType: {
      type: String,
      enum: {
        values: ["Savings Account", "Current Account", "Checking Account", "Premier Checking Account"],
        message: "Invalid account type"
      },
      default: "Savings Account"
    },
    accountStatus: {
      type: String,
      enum: {
        values: ["Active", "Deactivated", "Suspended"],
        message: "Invalid account status"
      },
      default: "Active"
    },
    balance: {
      type: Number,
      default: 84250.75,
      min: [0, "Account balance cannot be negative"]
    },
    currency: {
      type: String,
      default: "INR"
    },
    avatar: {
      type: String,
      default: "NX"
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Mongoose Pre-Save Hook: Automatically hash password with bcrypt when modified

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Instance Method: Compare candidate password with stored bcrypt hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
