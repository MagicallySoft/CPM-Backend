"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskStatus = exports.deleteTask = exports.updateTask = exports.getUserTasks = exports.getTasksByAdmin = exports.assignTask = void 0;
const taskModel_1 = __importDefault(require("../../models/task/taskModel"));
const responseHandler_1 = require("../../utils/responseHandler");
// Admin assigns a task to a user
const assignTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, assignedTo, deadline } = req.body;
        if (!title || !description || !assignedTo || !deadline || !Array.isArray(assignedTo)) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "All fields are required");
        }
        const taskUsers = assignedTo.map(userId => ({
            staffUserId: userId,
        }));
        const newTask = new taskModel_1.default({
            title,
            description,
            assignedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            assignedTo: taskUsers,
            deadline,
            status: "Pending",
            isGroupTask: assignedTo.length > 1 ? true : false
        });
        yield newTask.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Task assigned successfully", newTask);
    }
    catch (error) {
        next(error);
    }
});
exports.assignTask = assignTask;
// Get tasks assigned by an admin
const getTasksByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tasks = yield taskModel_1.default.find({ assignedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }).populate("assignedTo.staffUserId", "username email");
        // Group tasks by their status
        const groupedTasks = tasks.reduce((groups, task) => {
            const status = task.status || 'Unknown'; // Default to 'Unknown' if status is missing
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(task);
            return groups;
        }, {});
        // console.log(tasks)
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Tasks retrieved successfully", groupedTasks);
    }
    catch (error) {
        next(error);
    }
});
exports.getTasksByAdmin = getTasksByAdmin;
// Get tasks assigned to a user
const getUserTasks = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tasks = yield taskModel_1.default.find({ "assignedTo.staffUserId": (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
        // Group tasks by their status
        const groupedTasks = tasks.reduce((groups, task) => {
            const status = task.status || 'Unknown'; // Default to 'Unknown' if status is missing
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(task);
            return groups;
        }, {});
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "User tasks retrieved and grouped by status", groupedTasks);
    }
    catch (error) {
        next(error);
    }
});
exports.getUserTasks = getUserTasks;
// Update task (Admin can update task details)
const updateTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, deadline, assignedTo } = req.body;
        if (!title || !description || !assignedTo || !deadline || !Array.isArray(assignedTo)) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "All fields are required");
        }
        const isCompletedTask = yield taskModel_1.default.findOne({ _id: id, status: "Completed" });
        if (isCompletedTask) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Completed Task can not be Updated");
        }
        const taskUsers = assignedTo.map(user => {
            var _a, _b;
            return ({
                staffUserId: user.staffUserId,
                isRemove: (_a = user.isRemove) !== null && _a !== void 0 ? _a : false, // Default to false if not provided
                remark: (_b = user.remark) !== null && _b !== void 0 ? _b : "" // Default to empty string if not provided
            });
        });
        const updatedTask = yield taskModel_1.default.findOneAndUpdate({ _id: id }, { title, description, deadline, assignedTo: taskUsers, isGroupTask: assignedTo.length > 1 ? true : false }, { new: true, runValidators: true });
        if (!updatedTask) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Task not found or unauthorized");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Task updated successfully", updatedTask);
    }
    catch (error) {
        next(error);
    }
});
exports.updateTask = updateTask;
// Delete task (Admin can delete task)
const deleteTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const deletedTask = yield taskModel_1.default.findOneAndDelete({ _id: id, assignedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId });
        if (!deletedTask) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Task not found or unauthorized");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Task deleted successfully");
    }
    catch (error) {
        next(error);
    }
});
exports.deleteTask = deleteTask;
// User updates task status and records timestamps
const updateTaskStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!["Pending", "InProgress", "Completed"].includes(status)) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid status value");
        }
        // Find and update in a single query
        const task = yield taskModel_1.default.findOne({ _id: id, "assignedTo.staffUserId": userId });
        if (!task)
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Task not found or you are not assigned");
        let updateQuery = {};
        const userTask = task.assignedTo.find((entry) => entry.staffUserId.toString() === userId);
        if (!userTask)
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "You are not assigned to this task");
        const updateUserTask = {};
        if (status === "InProgress" && userTask.userTaskStatus !== "InProgress") {
            updateUserTask.userTaskStatus = "InProgress";
            if (!userTask.startAt)
                updateUserTask.startAt = new Date();
            if (task.status === "Pending") {
                updateQuery.$set = { status: "InProgress", progressAt: new Date() };
            }
        }
        else if (status === "Completed" && userTask.userTaskStatus !== "Completed") {
            updateUserTask.userTaskStatus = "Completed";
            updateUserTask.completedAt = new Date();
            // Check if all users completed their tasks
            if (task.assignedTo.every((entry) => entry.userTaskStatus === "Completed")) {
                updateQuery.$set = { status: "Completed", completedAt: new Date() };
            }
        }
        else if (status === "Pending" && userTask.userTaskStatus !== "Pending") {
            updateUserTask.userTaskStatus = "Pending";
            updateUserTask.startAt = null;
            updateUserTask.completedAt = null;
            // Check if no other users are "InProgress"
            if (!task.assignedTo.some((entry) => entry.userTaskStatus === "InProgress")) {
                updateQuery.$set = { status: "Pending" };
                updateQuery.$unset = { progressAt: "" }; // Remove progressAt field
            }
        }
        if (Object.keys(updateUserTask).length) {
            updateQuery.$set = Object.assign(Object.assign({}, updateQuery.$set), { "assignedTo.$[user].userTaskStatus": updateUserTask.userTaskStatus, "assignedTo.$[user].startAt": updateUserTask.startAt, "assignedTo.$[user].completedAt": updateUserTask.completedAt });
        }
        const updatedTask = yield taskModel_1.default.findOneAndUpdate({ _id: id }, updateQuery, {
            new: true,
            arrayFilters: [{ "user.staffUserId": userId }], // Apply update only to the correct user
        });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Task status updated successfully", updatedTask);
    }
    catch (error) {
        next(error);
    }
});
exports.updateTaskStatus = updateTaskStatus;
