import { Request, Response } from "express";
import Stripe from "stripe";
import colors from "colors";
import { Types } from "mongoose";

import { StatusCodes } from "http-status-codes";
import { logger } from "../shared/logger";
import config from "../config";
import ApiError from "../errors/ApiErrors";
import stripe from "../config/stripe";
import { Purchase } from "../app/modules/purchase/purchase.model";
import { sendNotifications } from "./notificationsHelper";
import { USER_ROLES } from "../enums/user";
import { User } from "../app/modules/user/user.model";

const handleStripeWebhook = async (req: Request, res: Response) => {
  // Extract Stripe signature and webhook secret
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = config.stripe.webhookSecret as string;

  let event: Stripe.Event | undefined;

  // Verify the event signature
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Webhook signature verification failed. ${error}`,
    );
  }

  // Check if the event is valid
  if (!event) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid event received!");
  }

  // Extract event data and type
  const data = event.data.object as Stripe.Subscription | Stripe.Account;
  const eventType = event.type;

  // Handle the event based on its type
  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;

        const purchaseId = session.metadata?.purchaseId;
        if (!purchaseId) break;

        await Purchase.updateOne(
          { _id: purchaseId, status: "pending" },
          { status: "confirmed" },
        );
        // need to send notification
        const admin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });
        await sendNotifications({
          title: `Purchase Confirmed`,
          message: "Your purchase has been confirmed",
          receiver: new Types.ObjectId(admin?._id),
          sender: new Types.ObjectId(session.metadata?.userId),
          isRead: false,
        });
        break;
      }

      default:
        logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
    }
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error handling event: ${error}`,
    );
  }

  res.sendStatus(200);
};

export default handleStripeWebhook;
