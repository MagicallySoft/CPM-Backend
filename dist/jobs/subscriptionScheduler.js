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
// src/jobs/subscriptionScheduler.ts
const node_cron_1 = __importDefault(require("node-cron"));
const SubscriptionModel_1 = __importDefault(require("../models/auth/SubscriptionModel"));
const AdminUserModel_1 = __importDefault(require("../models/auth/AdminUserModel"));
const updateExpiredSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    try {
        // 1. Update Subscription records from "active" to "inactive" if they have expired
        const subscriptionResult = yield SubscriptionModel_1.default.updateMany({ endDate: { $lt: now }, status: "active" }, { $set: { status: "inactive" } });
        console.log(`Updated ${subscriptionResult.modifiedCount} expired subscriptions.`);
        // 2. Find all adminIds that now have expired subscriptions
        const expiredAdminIds = yield SubscriptionModel_1.default.find({
            endDate: { $lt: now },
            status: "inactive",
        }).distinct("adminId");
        // 3. Update AdminUser's Subscription field to "inactive" for these admins
        const adminResult = yield AdminUserModel_1.default.updateMany({ _id: { $in: expiredAdminIds } }, { $set: { Subscription: "inactive" } });
        console.log(`Updated ${adminResult.modifiedCount} admin user subscription statuses to inactive.`);
    }
    catch (error) {
        console.error("Error updating subscriptions", error);
    }
});
// Schedule the function to run once every hour
node_cron_1.default.schedule("0 * * * *", () => {
    updateExpiredSubscriptions();
});
