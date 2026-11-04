import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { USER_ROLES } from "../enums/user";
import { Cart } from "../app/modules/cart/cart.model";
import { Purchase } from "../app/modules/purchase/purchase.model";
import { awardPurchasePoints } from "../app/modules/purchase/purchase.points";
import { User } from "../app/modules/user/user.model";
import { sendNotifications } from "./notificationsHelper";
import { logger } from "../shared/logger";

const confirmPaidCheckout = async (session: Stripe.Checkout.Session) => {
  console.log("Session", session);
  if (session.payment_status !== "paid") return;

  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) return;

  let confirmed = false;
  const dbSession = await mongoose.startSession();
  try {
    dbSession.startTransaction();
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      status: "pending",
    }).session(dbSession);

    if (purchase) {
      const cartItems = await Cart.find({
        _id: { $in: purchase.cartId },
        userId: purchase.userId,
      }).session(dbSession);

      if (cartItems.length) {
        if (!purchase.items?.length) {
          purchase.items = cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            unitPrice: item.unitPrice ?? item.lockedUnitPrice ?? 0,
          }));
          await purchase.save({ session: dbSession });
        }
        const res = await Cart.deleteMany({
          _id: { $in: cartItems.map((item) => item._id) },
          userId: purchase.userId,
        }).session(dbSession);
        console.log("Data delete", res);
      }

      await awardPurchasePoints(
        purchase.userId,
        purchase.items ?? [],
        dbSession,
      );

      await Purchase.updateOne(
        { _id: purchaseId, status: "pending" },
        { status: "confirmed" },
        { session: dbSession },
      );
      confirmed = true;
    }

    await dbSession.commitTransaction();
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    await dbSession.endSession();
  }

  if (!confirmed) return;

  try {
    const admin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).lean();
    if (!admin) return;

    await sendNotifications({
      title: "Purchase Confirmed",
      message: "Your purchase has been confirmed",
      receiver: admin._id,
      sender: new Types.ObjectId(session.metadata?.userId),
      isRead: false,
    });
  } catch (error) {
    logger.error(
      `Purchase ${purchaseId} confirmed, but notification failed: ${error}`,
    );
  }
};

export default confirmPaidCheckout;
