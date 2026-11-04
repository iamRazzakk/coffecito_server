import { Schema, model, Types } from "mongoose";

export type IGiftClaim = {
  gift: Types.ObjectId;
  user: Types.ObjectId;
  earnedPoints: number;
};

const giftClaimSchema = new Schema<IGiftClaim>(
  {
    gift: {
      type: Schema.Types.ObjectId,
      ref: "Gift",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    earnedPoints: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

giftClaimSchema.index({ gift: 1, user: 1 }, { unique: true });

export const GiftClaim = model<IGiftClaim>("GiftClaim", giftClaimSchema);
