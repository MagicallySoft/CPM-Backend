// src/jobs/subscriptionScheduler.ts
import cron from "node-cron";
import Subscription from "../models/auth/SubscriptionModel";
import AdminUser from "../models/auth/AdminUserModel";

const updateExpiredSubscriptions = async () => {
  const now = new Date();
  try {
    // 1. Update Subscription records from "active" to "inactive" if they have expired
    const subscriptionResult = await Subscription.updateMany(
      { endDate: { $lt: now }, status: "active" },
      { $set: { status: "inactive" } }
    );
    console.log(`Updated ${subscriptionResult.modifiedCount} expired subscriptions.`);

    // 2. Find all adminIds that now have expired subscriptions
    const expiredAdminIds = await Subscription.find({
      endDate: { $lt: now },
      status: "inactive",
    }).distinct("adminId");

    // 3. Update AdminUser's Subscription field to "inactive" for these admins
    const adminResult = await AdminUser.updateMany(
      { _id: { $in: expiredAdminIds } },
      { $set: { Subscription: "inactive" } }
    );
    console.log(`Updated ${adminResult.modifiedCount} admin user subscription statuses to inactive.`);
  } catch (error) {
    console.error("Error updating subscriptions", error);
  }
};

// Schedule the function to run once every hour
cron.schedule("0 * * * *", () => {
  updateExpiredSubscriptions();
});
