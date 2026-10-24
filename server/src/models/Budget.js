import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    category: {
      type: String,
      required: [true, "Budget category is required"],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [1, "Budget amount must be greater than zero"]
    },
    month: {
      type: String, // Format: "YYYY-MM", e.g. "2026-08"
      required: [true, "Budget month is required"],
      trim: true,
      index: true
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure 1 budget per category per month per user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
export default Budget;
