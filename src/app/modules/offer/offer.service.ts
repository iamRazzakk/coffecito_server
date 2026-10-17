import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { Product } from "../product/product.model";
import { Shop } from "../shop/shop.model";
import { IOffer, OfferType } from "./offer.interface";
import { Offer } from "./offer.model";

const requireNumber = (value: number | undefined, label: string) => {
  if (value == null || Number.isNaN(value)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `${label} is required`);
  }
};

const assertOfferConfig = (payload: Partial<IOffer>) => {
  const offerType = payload.offerType as OfferType | undefined;
  if (!offerType) return;

  if (offerType === "BOGO") {
    requireNumber(payload.buyQuantity, "Buy quantity");
    requireNumber(payload.getQuantity, "Get quantity");
  }
  if (offerType === "BUY_X_GET_PERCENT") {
    requireNumber(payload.buyQuantity, "Buy quantity");
    requireNumber(payload.getQuantity, "Get quantity");
    requireNumber(payload.percentOff, "Percent off");
  }
  if (
    offerType === "FLAT_PERCENT" ||
    offerType === "FIRST_ORDER" ||
    offerType === "FLASH_SALE" ||
    offerType === "HAPPY_HOUR" ||
    offerType === "SEASONAL" ||
    offerType === "UP_TO_PERCENT"
  ) {
    requireNumber(payload.percentOff, "Percent off");
  }
  if (offerType === "UP_TO_PERCENT") {
    requireNumber(payload.maxDiscountAmount, "Max discount amount");
  }
  if (offerType === "FLASH_SALE" || offerType === "SEASONAL") {
    if (!payload.startAt || !payload.endAt) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Start and end date are required",
      );
    }
  }
  if (offerType === "HAPPY_HOUR" && (!payload.startTime || !payload.endTime)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Start time and end time are required",
    );
  }
  if (offerType === "MIN_PURCHASE") {
    requireNumber(payload.minAmount, "Minimum amount");
    requireNumber(payload.discountValue, "Discount value");
    if (!payload.discountType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Discount type is required");
    }
  }
  if (offerType === "SPEND_MORE_SAVE_MORE" && !payload.tiers?.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one tier is required",
    );
  }
  if (offerType === "FREE_GIFT") {
    if (!payload.giftProductId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Gift product is required");
    }
    if (payload.minAmount == null && payload.minQuantity == null) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Minimum amount or minimum quantity is required",
      );
    }
  }
  if (offerType === "COMBO") {
    if (!payload.comboProductIds || payload.comboProductIds.length < 2) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Combo needs at least two products",
      );
    }
    requireNumber(payload.comboPrice, "Combo price");
  }
};

const assertShopAndProducts = async (payload: Partial<IOffer>) => {
  if (payload.shopId) {
    const shop = await Shop.findById(payload.shopId);
    if (!shop) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
    }
  }

  const productIds = [
    ...(payload.productIds ?? []),
    ...(payload.comboProductIds ?? []),
    ...(payload.giftProductId ? [payload.giftProductId] : []),
  ];
  if (!productIds.length) return;

  const products = await Product.find({ _id: { $in: productIds } }).select(
    "shopId",
  );
  if (products.length !== new Set(productIds.map((id) => id.toString())).size) {
    throw new ApiError(StatusCodes.NOT_FOUND, "One or more products not found");
  }
  if (payload.shopId) {
    const shopId = payload.shopId.toString();
    const outsideShop = products.some(
      (product) => product.shopId?.toString() !== shopId,
    );
    if (outsideShop) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Offer products must belong to the same shop",
      );
    }
  }
};

const toObjectIds = (ids?: string[]) =>
  (ids ?? []).map((id) => new Types.ObjectId(id));

const normalizePayload = (payload: IOffer) => ({
  ...payload,
  shopId: new Types.ObjectId(payload.shopId),
  productIds: toObjectIds(payload.productIds as unknown as string[]),
  comboProductIds: payload.comboProductIds
    ? toObjectIds(payload.comboProductIds as unknown as string[])
    : undefined,
  giftProductId: payload.giftProductId
    ? new Types.ObjectId(payload.giftProductId)
    : undefined,
});

const createOfferToDB = async (payload: IOffer) => {
  assertOfferConfig(payload);
  const offer = normalizePayload(payload);
  await assertShopAndProducts(offer);
  return Offer.create(offer);
};

const getAllOffersFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  if (query.shopId) filter.shopId = query.shopId;
  if (query.isActive === "true") filter.isActive = true;
  if (query.isActive === "false") filter.isActive = false;
  if (query.offerType) filter.offerType = query.offerType;
  return Offer.find(filter).sort({ createdAt: -1 });
};

const getOfferByIdFromDB = async (id: string) => {
  const offer = await Offer.findById(id);
  if (!offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");
  }
  return offer;
};

const updateOfferByIdToDB = async (id: string, payload: Partial<IOffer>) => {
  const existing = await Offer.findById(id);
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");
  }
  const current = existing.toObject() as IOffer;
  const next = { ...current, ...payload };
  assertOfferConfig(next);
  const normalized = normalizePayload(next);
  await assertShopAndProducts(normalized);
  return Offer.findByIdAndUpdate(id, normalized, {
    new: true,
    runValidators: true,
  });
};

const deleteOfferByIdFromDB = async (id: string) => {
  const offer = await Offer.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");
  }
  return offer;
};

const getAllActiveOffersFromDB = async () => {
  return Offer.find({ isActive: true }).select("image");
};

export const OfferServices = {
  createOfferToDB,
  getAllOffersFromDB,
  getOfferByIdFromDB,
  updateOfferByIdToDB,
  deleteOfferByIdFromDB,
  getAllActiveOffersFromDB,
};
