import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    cardNumber: {
      type: String,
      default: "4501 8820 9104 9104"
    },
    cardHolder: {
      type: String,
      default: "Demo Customer"
    },
    expiryDate: {
      type: String,
      default: "08/29"
    },
    cvv: {
      type: String,
      default: "842"
    },
    cardType: {
      type: String,
      default: "Visa Infinite Virtual"
    },
    isFrozen: {
      type: Boolean,
      default: false
    },
    monthlyLimit: {
      type: Number,
      default: 50000,
      min: 1000
    },
    contactlessEnabled: {
      type: Boolean,
      default: true
    },
    internationalEnabled: {
      type: Boolean,
      default: false
    },
    onlineTransactionsEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);
export default Card;
