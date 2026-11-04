import { Schema, model } from "mongoose";
import { IGift, GiftModel } from "./gift.interface";

const giftSchema = new Schema<IGift, GiftModel>(
  {
    image: {
      type: String,
      required: true,
    },
    minPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    availableDays: {
      type: Number,
      required: true,
      min: 1,
    },
    collectLocation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

giftSchema.index({ collectLocation: 1, createDate: -1 });

export const Gift = model<IGift, GiftModel>("Gift", giftSchema);
