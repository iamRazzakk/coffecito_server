import { Worker } from "bullmq";
import { connectionBullMQ, couponQueue } from "../config/bullMQ.config";
import { CouponCode } from "../app/modules/coupon_code/coupon_code.model";
import { logger } from "../shared/logger";

const EXPIRE_COUPONS_JOB = "expire-coupons";

const expireCoupons = async () => {
  const result = await CouponCode.updateMany(
    {
      isActive: true,
      expireDate: { $lte: new Date() },
    },
    { $set: { isActive: false } },
  );
  if (result.modifiedCount > 0) {
    logger.info(`Deactivated ${result.modifiedCount} expired coupons`);
  }
  return result.modifiedCount;
};

const couponWorker = new Worker(
  "couponQueue",
  async (job) => {
    if (job.name !== EXPIRE_COUPONS_JOB) return;
    return expireCoupons();
  },
  {
    connection: connectionBullMQ,
    concurrency: 1,
  },
);

couponWorker.on("failed", (job, error) => {
  logger.error(`Coupon expire job ${job?.id} failed: ${error.message}`);
});

export const scheduleCouponExpiry = async () => {
  await couponQueue.upsertJobScheduler(
    EXPIRE_COUPONS_JOB,
    { pattern: "*/5 * * * *" },
    { name: EXPIRE_COUPONS_JOB },
  );
  logger.info("Coupon expiry job scheduled every 5 minutes");
};

export default couponWorker;
