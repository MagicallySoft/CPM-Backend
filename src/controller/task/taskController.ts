import { Request, Response, NextFunction } from "express";
import Task from "../../models/task/taskModel";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

// Admin assigns a task to a user
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;
    if (!title || !description || !assignedTo || !deadline || !Array.isArray(assignedTo)) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    const taskUsers = assignedTo.map(userId => ({
      staffUserId: userId,
    }));

    const newTask = new Task({
      title,
      description,
      assignedBy: req.user?.id,
      assignedTo: taskUsers,
      deadline,
      status: "Pending",
      isGroupTask: assignedTo.length > 1 ? true:false
    });

    await newTask.save();
    return sendSuccessResponse(res, 201, "Task assigned successfully", newTask);
  } catch (error) {
    next(error);
  }
};

// Get tasks assigned by an admin
export const getTasksByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await Task.find({ assignedBy: req.user?.id }).populate("assignedTo.staffUserId", "username email");
     
    // Group tasks by their status
     const groupedTasks = tasks.reduce((groups:any, task) => {
      const status = task.status || 'Unknown'; // Default to 'Unknown' if status is missing
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(task);
      return groups;
    }, {});
    // console.log(tasks)
    return sendSuccessResponse(res, 200, "Tasks retrieved successfully", groupedTasks);
  } catch (error) {
    next(error);
  }
};

// Get tasks assigned to a user
export const getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await Task.find({ "assignedTo.staffUserId": req.user?.id });

    // Group tasks by their status
    const groupedTasks = tasks.reduce((groups:any, task) => {
      const status = task.status || 'Unknown'; // Default to 'Unknown' if status is missing
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(task);
      return groups;
    }, {});

    return sendSuccessResponse(res, 200, "User tasks retrieved and grouped by status", groupedTasks);
  } catch (error) {
    next(error);
  }
};


// Update task (Admin can update task details)
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, deadline ,assignedTo} = req.body;


    if (!title || !description || !assignedTo || !deadline || !Array.isArray(assignedTo)) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    const isCompletedTask = await Task.findOne({ _id: id, status: "Completed"});
    if(isCompletedTask){
      return sendErrorResponse(res, 404, "Completed Task can not be Updated");
    }

    const taskUsers = assignedTo.map(user => ({
      staffUserId: user.staffUserId, 
      isRemove: user.isRemove ?? false,  // Default to false if not provided
      remark: user.remark ?? ""          // Default to empty string if not provided
    }));

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      { title, description, deadline,assignedTo:taskUsers,isGroupTask: assignedTo.length > 1 ? true:false},
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return sendErrorResponse(res, 404, "Task not found or unauthorized");
    }

    return sendSuccessResponse(res, 200, "Task updated successfully", updatedTask);
  } catch (error) {
    next(error);
  }
};

// Delete task (Admin can delete task)
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findOneAndDelete({ _id: id, assignedBy: req.user?.userId });

    if (!deletedTask) {
      return sendErrorResponse(res, 404, "Task not found or unauthorized");
    }

    return sendSuccessResponse(res, 200, "Task deleted successfully");
  } catch (error) {
    next(error);
  }
};

// User updates task status and records timestamps
export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!["Pending", "InProgress", "Completed"].includes(status)) {
      return sendErrorResponse(res, 400, "Invalid status value");
    }

    // Find and update in a single query
    const task = await Task.findOne({ _id: id, "assignedTo.staffUserId": userId });

    if (!task) return sendErrorResponse(res, 404, "Task not found or you are not assigned");

    let updateQuery: any = {};
    const userTask = task.assignedTo.find((entry: any) => entry.staffUserId.toString() === userId);

    if (!userTask) return sendErrorResponse(res, 403, "You are not assigned to this task");

    const updateUserTask: any = {};

    if (status === "InProgress" && userTask.userTaskStatus !== "InProgress") {
      updateUserTask.userTaskStatus = "InProgress";
      if (!userTask.startAt) updateUserTask.startAt = new Date();

      if (task.status === "Pending") {
        updateQuery.$set = { status: "InProgress", progressAt: new Date() };
      }
    } else if (status === "Completed" && userTask.userTaskStatus !== "Completed") {
      updateUserTask.userTaskStatus = "Completed";
      updateUserTask.completedAt = new Date();

      // Check if all users completed their tasks
      if (task.assignedTo.every((entry: any) => entry.userTaskStatus === "Completed")) {
        updateQuery.$set = { status: "Completed", completedAt: new Date() };
      }
    } else if (status === "Pending" && userTask.userTaskStatus !== "Pending") {
      updateUserTask.userTaskStatus = "Pending";
      updateUserTask.startAt = null;
      updateUserTask.completedAt = null;

      // Check if no other users are "InProgress"
      if (!task.assignedTo.some((entry: any) => entry.userTaskStatus === "InProgress")) {
        updateQuery.$set = { status: "Pending" };
        updateQuery.$unset = { progressAt: "" }; // Remove progressAt field
      }
    }

    if (Object.keys(updateUserTask).length) {
      updateQuery.$set = {
        ...updateQuery.$set,
        "assignedTo.$[user].userTaskStatus": updateUserTask.userTaskStatus,
        "assignedTo.$[user].startAt": updateUserTask.startAt,
        "assignedTo.$[user].completedAt": updateUserTask.completedAt,
      };
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      updateQuery,
      {
        new: true,
        arrayFilters: [{ "user.staffUserId": userId }], // Apply update only to the correct user
      }
    );

    return sendSuccessResponse(res, 200, "Task status updated successfully", updatedTask);
  } catch (error) {
    next(error);
  }
};
