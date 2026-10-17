import { Model, Types } from "mongoose";
import { OFFER_TYPES } from "./offer.constants";

export type OfferType = (typeof OFFER_TYPES)[number];

export type DiscountKind = "percentage" | "fixed";

export type IOfferTier = {
  minAmount: number;
  discountType: DiscountKind;
  discountValue: number;
};

export type IOffer = {
  title: string;
  description: string;
  image: string;
  offerType: OfferType;
  shopId: Types.ObjectId;
  productIds: Types.ObjectId[];
  isActive: boolean;
  buyQuantity?: number;
  getQuantity?: number;
  percentOff?: number;
  maxDiscountAmount?: number;
  minAmount?: number;
  minQuantity?: number;
  discountType?: DiscountKind;
  discountValue?: number;
  tiers?: IOfferTier[];
  startAt?: Date;
  endAt?: Date;
  startTime?: string;
  endTime?: string;
  days?: number[];
  giftProductId?: Types.ObjectId;
  comboProductIds?: Types.ObjectId[];
  comboPrice?: number;
};

export type OfferModel = Model<IOffer>;
