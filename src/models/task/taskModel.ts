import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  assignedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  deadline: Date;
  status: "Pending" | "InProgress" | "Completed";
  createdAt: Date;
  progressAt?: Date; // When the task status changes to "InProgress"
  completedAt?: Date; // When the task status changes to "Completed"
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "StaffUser", required: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Pending", "InProgress", "Completed"],
      default: "Pending",
    },
    progressAt: { type: Date }, // Timestamp when moved to "InProgress"
    completedAt: { type: Date }, // Timestamp when moved to "Completed"
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.model<ITask>("Task", TaskSchema);
