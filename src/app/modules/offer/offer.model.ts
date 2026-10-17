import { Schema, model } from "mongoose";
import { IOffer, OfferModel } from "./offer.interface";
import { OFFER_TYPES } from "./offer.constants";

const offerTierSchema = new Schema(
  {
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const offerSchema = new Schema<IOffer, OfferModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    offerType: {
      type: String,
      enum: OFFER_TYPES,
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    productIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    buyQuantity: {
      type: Number,
      min: 1,
    },
    getQuantity: {
      type: Number,
      min: 1,
    },
    percentOff: {
      type: Number,
      min: 0,
      max: 100,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    minAmount: {
      type: Number,
      min: 0,
    },
    minQuantity: {
      type: Number,
      min: 1,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      min: 0,
    },
    tiers: {
      type: [offerTierSchema],
      default: undefined,
    },
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    days: {
      type: [Number],
    },
    giftProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    comboProductIds: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
    },
    comboPrice: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true },
);

offerSchema.index({ shopId: 1, isActive: 1, offerType: 1 });

export const Offer = model<IOffer, OfferModel>("Offer", offerSchema);
