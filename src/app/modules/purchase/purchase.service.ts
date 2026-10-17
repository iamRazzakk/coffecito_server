import { JwtPayload } from "jsonwebtoken";
import { Cart } from "../cart/cart.model";
import { IPurchase } from "./purchase.interface";
import { Purchase } from "./purchase.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Product } from "../product/product.model";
import { priceProduct } from "../product/product.utils";
import { Offer } from "../offer/offer.model";
import { CouponCode } from "../coupon_code/coupon_code.model";
import { awardPurchasePoints } from "./purchase.points";
import { finalizeCheckoutPrice } from "./purchase.pricing";
import {
  buildStripeLineItems,
  quoteOffers,
} from "../offer/offer.calculator";
import stripe from "../../../config/stripe";
import config from "../../../config";
import QueryBuilder from "../../builder/queryBuilder";

const createPurchaseDataIntoDB = async (
  payload: Pick<IPurchase, "cartId" | "couponCodeId"> & { offerId?: string },
  user: JwtPayload,
) => {
  if (!payload.cartId?.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cart ids are required");
  }
  if (!config.stripe.paymentSuccessUrl) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Payment success url is missing",
    );
  }
  const cartItems = await Cart.find({
    _id: { $in: payload.cartId },
    userId: new Types.ObjectId(user.id),
  });
  if (cartItems.length !== payload.cartId.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "One or more cart items not found",
    );
  }
  const products = await Product.find({
    _id: { $in: cartItems.map((item) => item.productId) },
  }).lean();
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  const cartLines = cartItems.map((cartItem) => {
    const product = productById.get(cartItem.productId.toString());
    if (!product || !product.status) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "A product in your cart is unavailable",
      );
    }
    const productPrice = priceProduct(product, {
      size: cartItem.size,
      extras: cartItem.extras,
    });
    return {
      cartItem,
      product,
      unitPrice: productPrice.unitPrice,
      taxPercentage: productPrice.taxPercentage,
    };
  });
  const shopIds = [
    ...new Set(cartLines.map((cartLine) => cartLine.product.shopId.toString())),
  ];
  const offerFilter: Record<string, unknown> = {
    shopId: { $in: shopIds },
    isActive: true,
  };
  if (payload.offerId) offerFilter._id = payload.offerId;
  const offers = await Offer.find(offerFilter).lean();
  if (payload.offerId && !offers.length) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");
  }
  const hasPreviousOrder = Boolean(
    await Purchase.exists({
      userId: new Types.ObjectId(user.id),
      status: { $in: ["confirmed", "delivered"] },
    }),
  );
  const offerQuote = quoteOffers(
    cartLines.map((cartLine) => ({
      key: cartLine.cartItem._id.toString(),
      productId: cartLine.product._id.toString(),
      productName: cartLine.product.productName,
      size: cartLine.cartItem.size,
      quantity: cartLine.cartItem.quantity,
      unitPrice: cartLine.unitPrice,
      lineTotal: cartLine.unitPrice * cartLine.cartItem.quantity,
      taxPercentage: cartLine.taxPercentage,
      shopId: cartLine.product.shopId.toString(),
    })),
    offers,
    { now: new Date(), hasPreviousOrder },
  );
  if (payload.offerId && offerQuote.offer?._id.toString() !== payload.offerId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This offer does not apply to the cart",
    );
  }

  const coupon = payload.couponCodeId
    ? await CouponCode.findById(payload.couponCodeId).lean()
    : null;
  if (payload.couponCodeId && !coupon) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Coupon not found");
  }
  const checkoutPrice = finalizeCheckoutPrice(offerQuote, coupon);

  const stripeLines = buildStripeLineItems(checkoutPrice.lines);
  const chargedCents = stripeLines.reduce(
    (sum, line) => sum + line.unitAmount * line.quantity,
    0,
  );
  if (chargedCents > 0 && chargedCents < 50) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Payable amount is below the minimum card charge",
    );
  }

  const purchaseItems = checkoutPrice.lines.map((line) => ({
    productId: new Types.ObjectId(line.productId),
    quantity: line.quantity,
    size: line.size,
    unitPrice: line.quantity ? line.payable / line.quantity : 0,
  }));
  const userId = new Types.ObjectId(user.id);
  const purchase = await Purchase.create({
    cartId: cartItems.map((item) => item._id),
    userId,
    subtotal: checkoutPrice.merchandiseSubtotal,
    offerDiscountAmount: checkoutPrice.offerDiscountAmount,
    couponDiscountAmount: checkoutPrice.couponDiscountAmount,
    discountAmount: checkoutPrice.discountAmount,
    taxableAmount: checkoutPrice.taxableAmount,
    taxAmount: checkoutPrice.taxAmount,
    amount: checkoutPrice.payableAmount,
    offerId: offerQuote.offer?._id,
    couponCodeId: payload.couponCodeId,
    items: purchaseItems,
    status: chargedCents === 0 ? "confirmed" : "pending",
  });

  await Cart.bulkWrite(
    cartLines.map((cartLine) => ({
      updateOne: {
        filter: { _id: cartLine.cartItem._id },
        update: {
          $set: {
            unitPrice: cartLine.unitPrice,
            lockedUnitPrice: cartLine.unitPrice,
          },
        },
      },
    })),
  );

  if (chargedCents === 0) {
    await awardPurchasePoints(userId, purchaseItems);
    await Cart.deleteMany({
      _id: { $in: cartItems.map((item) => item._id) },
      userId,
    });
    return {
      url: null,
      purchaseId: purchase._id,
      subtotal: checkoutPrice.merchandiseSubtotal,
      offerDiscountAmount: checkoutPrice.offerDiscountAmount,
      couponDiscountAmount: checkoutPrice.couponDiscountAmount,
      discountAmount: checkoutPrice.discountAmount,
      taxableAmount: checkoutPrice.taxableAmount,
      taxAmount: checkoutPrice.taxAmount,
      amount: checkoutPrice.payableAmount,
      offerId: offerQuote.offer?._id ?? null,
      couponCodeId: payload.couponCodeId ?? null,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: config.stripe.paymentSuccessUrl,
    cancel_url: config.stripe.paymentSuccessUrl,
    line_items: stripeLines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "usd",
        unit_amount: line.unitAmount,
        product_data: {
          name: line.name,
        },
      },
    })),
    metadata: {
      purchaseId: purchase._id.toString(),
      userId: user.id,
      offerId: offerQuote.offer?._id.toString() ?? "",
      couponCodeId: payload.couponCodeId?.toString() ?? "",
      offerDiscountAmount: String(checkoutPrice.offerDiscountAmount),
      couponDiscountAmount: String(checkoutPrice.couponDiscountAmount),
      discountAmount: String(checkoutPrice.discountAmount),
    },
  });
  if (!session.url) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create payment url");
  }
  return {
    url: session.url,
    purchaseId: purchase._id,
    subtotal: checkoutPrice.merchandiseSubtotal,
    offerDiscountAmount: checkoutPrice.offerDiscountAmount,
    couponDiscountAmount: checkoutPrice.couponDiscountAmount,
    discountAmount: checkoutPrice.discountAmount,
    taxableAmount: checkoutPrice.taxableAmount,
    taxAmount: checkoutPrice.taxAmount,
    amount: checkoutPrice.payableAmount,
    offerId: offerQuote.offer?._id ?? null,
    couponCodeId: payload.couponCodeId ?? null,
  };
};

const getMyPurchasesHistoryFromDB = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const purchases = new QueryBuilder(
    Purchase.find({ userId: new Types.ObjectId(user.id) }),
    query,
  )
    .filter()
    .sort()
    .paginate();
  const [meta, data] = await Promise.all([
    purchases.getPaginationInfo(),
    purchases.modelQuery.exec(),
  ]);
  return { meta, data };
};

const getAllPurchaseHistoryFromDB = async (query: Record<string, any>) => {
  const purchases = new QueryBuilder(Purchase.find(), query)
    .filter()
    .sort()
    .populate(["userId"], {
      userId: "name phone",
    })
    .paginate();
  const [meta, data] = await Promise.all([
    purchases.getPaginationInfo(),
    purchases.modelQuery.exec(),
  ]);
  return { meta, data };
};

export const PurchaseServices = {
  createPurchaseDataIntoDB,
  getMyPurchasesHistoryFromDB,
  getAllPurchaseHistoryFromDB,
};
