import mongoose, { Schema, Document } from "mongoose";

export interface ITaskUser {
  staffUserId: mongoose.Types.ObjectId;
  userTaskStatus: "Pending" | "InProgress" | "Completed";
  startAt?: Date | null;
  completedAt?: Date | null;
  isRemove:Boolean,
  remark:String
}

export interface ITask extends Document {
  title: string;
  description: string;
  assignedBy: mongoose.Types.ObjectId;
  // assignedTo: mongoose.Types.ObjectId;
  assignedTo: ITaskUser[]; // Array of assigned users with their status;
  deadline: Date;
  status: "Pending" | "InProgress" | "Completed";
  isGroupTask: Boolean;
  createdAt: Date;
  progressAt?: Date; // When the task status changes to "InProgress"
  completedAt?: Date; // When the task status changes to "Completed"
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    // assignedTo: { type: Schema.Types.ObjectId, ref: "StaffUser", required: true },
    assignedTo: [
      {
        staffUserId: {
          type: Schema.Types.ObjectId,
          ref: "StaffUser",
          required: true,
        },
        userTaskStatus: {
          type: String,
          enum: ["Pending", "InProgress", "Completed"],
          default: "Pending",
        },
        startAt: { type: Date},
        completedAt: { type: Date},
        isRemove: { type: Boolean, default: false },
        remark: { type: String },
      },
    ], // Array of assigned user,
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Pending", "InProgress", "Completed"],
      default: "Pending",
    },
    isGroupTask: { type: Boolean, default: false },
    progressAt: { type: Date }, // Timestamp when moved to "InProgress"
    completedAt: { type: Date }, // Timestamp when moved to "Completed"
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.model<ITask>("Task", TaskSchema);
