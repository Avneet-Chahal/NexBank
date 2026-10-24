import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    category: {
      type: String,
      required: [true, "Issue category is required"],
      enum: [
        "Card Dispute",
        "Transaction Query",
        "Technical Bug",
        "Account Verification",
        "General Inquiry"
      ]
    },
    subject: {
      type: String,
      required: [true, "Subject line is required"],
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true
    },
    transactionReference: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ["Open", "In Review", "Resolved"],
      default: "Open"
    },
    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal"
    }
  },
  {
    timestamps: true
  }
);

export const SupportTicket =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
