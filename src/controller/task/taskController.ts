import { Request, Response, NextFunction } from "express";
import Task from "../../models/task/taskModel";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

// Admin assigns a task to a user
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;
    // console.log({ title, description, assignedTo, deadline })
    if (!title || !description || !assignedTo || !deadline) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    const newTask = new Task({
      title,
      description,
      assignedBy: req.user?.userId,
      assignedTo,
      deadline,
      status: "Pending",
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
    const tasks = await Task.find({ assignedBy: req.user?.userId }).populate("assignedTo", "username email");
    // console.log(req.user?.userId);
    
    // console.log(tasks)
    return sendSuccessResponse(res, 200, "Tasks retrieved successfully", tasks);
  } catch (error) {
    next(error);
  }
};

// Get tasks assigned to a user
export const getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user?.userId });

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
    const { title, description, deadline } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, assignedBy: req.user?.userId },
      { title, description, deadline },
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

    if (!["Pending", "InProgress", "Completed"].includes(status)) {
      return sendErrorResponse(res, 400, "Invalid status value");
    }

    const updateFields: any = { status };

    if (status === "InProgress") {
      updateFields.progressAt = new Date(); // Save timestamp when moved to "InProgress"
    } else if (status === "Completed") {
      updateFields.completedAt = new Date(); // Save timestamp when moved to "Completed"
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, assignedTo: req.user?.userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return sendErrorResponse(res, 404, "Task not found or unauthorized");
    }

    return sendSuccessResponse(res, 200, "Task status updated successfully", updatedTask);
  } catch (error) {
    next(error);
  }
};
