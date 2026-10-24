import mongoose from "mongoose";

/**
 * NexBank – Mongoose Transaction Schema
 * Demonstrates:
 * - Schema definition with strict field types
 * - Mongoose Document Reference linking to User model (ref: "User")
 * - Field-level validations (required, min, max, enum)
 * - Automatic createdAt and updatedAt timestamps
 */
const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must reference a valid customer account"],
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      minlength: [2, "Category must be at least 2 characters"],
      maxlength: [50, "Category cannot exceed 50 characters"]
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: ["income", "expense"],
        message: "Type must be either 'income' or 'expense'"
      },
      lowercase: true
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be a positive number greater than 0"],
      max: [10000000, "Amount exceeds maximum transaction threshold limit of ₹10,000,000"]
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ["Completed", "Pending", "Cancelled"],
        message: "Status must be 'Completed', 'Pending', or 'Cancelled'"
      },
      default: "Completed"
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;
