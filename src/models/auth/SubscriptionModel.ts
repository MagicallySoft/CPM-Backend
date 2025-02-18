// models/Subscription.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  adminId: mongoose.Types.ObjectId; // Reference to the AdminUser
  plan: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  paymentInfo?: any; // e.g. transaction details
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    plan: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    paymentInfo: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// 🔹 Fast lookup by admin and status
SubscriptionSchema.index({ adminId: 1, status: 1 });

const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
