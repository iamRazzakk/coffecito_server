import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { USER_ROLES } from "../enums/user";
import { Cart } from "../app/modules/cart/cart.model";
import { Purchase } from "../app/modules/purchase/purchase.model";
import { awardPurchasePoints } from "../app/modules/purchase/purchase.points";
import { User } from "../app/modules/user/user.model";
import { sendNotifications } from "./notificationsHelper";

const confirmPaidCheckout = async (session: Stripe.Checkout.Session) => {
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
        await Cart.deleteMany({
          _id: { $in: cartItems.map((item) => item._id) },
          userId: purchase.userId,
        }).session(dbSession);
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

  const admin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });
  await sendNotifications({
    title: "Purchase Confirmed",
    message: "Your purchase has been confirmed",
    receiver: new Types.ObjectId(admin?._id),
    sender: new Types.ObjectId(session.metadata?.userId),
    isRead: false,
  });
};

export default confirmPaidCheckout;
