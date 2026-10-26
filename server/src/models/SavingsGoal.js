import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [100, "Target amount must be at least 100"]
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: [0, "Saved amount cannot be negative"]
    },
    targetDate: {
      type: Date,
      required: [true, "Target completion date is required"]
    },
    category: {
      type: String,
      default: "General",
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: "INR"
    },
    reminderSent10Day: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const SavingsGoal = mongoose.models.SavingsGoal || mongoose.model("SavingsGoal", savingsGoalSchema);
export default SavingsGoal;
