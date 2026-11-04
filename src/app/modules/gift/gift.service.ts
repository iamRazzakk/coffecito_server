import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { User } from "../user/user.model";
import { GIFT_DAY_MS } from "./gift.constants";
import { GiftClaim } from "./gift.claim.model";
import { IGift } from "./gift.interface";
import { Gift } from "./gift.model";

const availableFilter = () => ({
  $expr: {
    $gt: [
      {
        $add: ["$createDate", { $multiply: ["$availableDays", GIFT_DAY_MS] }],
      },
      new Date(),
    ],
  },
});

const createGiftToDB = async (payload: IGift) => {
  return Gift.create({
    ...payload,
    createDate: payload.createDate ?? new Date(),
  });
};

const getAllGiftsFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};
  if (typeof query.collectLocation === "string" && query.collectLocation) {
    filter.collectLocation = query.collectLocation;
  }
  if (query.available === "true") {
    Object.assign(filter, availableFilter());
  }
  return Gift.find(filter).sort({ createDate: -1 });
};

const getGiftByIdFromDB = async (id: string) => {
  const gift = await Gift.findById(id);
  if (!gift) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Gift not found");
  }
  return gift;
};

const updateGiftByIdToDB = async (id: string, payload: Partial<IGift>) => {
  const gift = await Gift.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!gift) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Gift not found");
  }
  return gift;
};

const deleteGiftByIdFromDB = async (id: string) => {
  const gift = await Gift.findByIdAndDelete(id);
  if (!gift) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Gift not found");
  }
  return gift;
};

const isAvailable = (gift: IGift) => {
  const expiresAt =
    new Date(gift.createDate).getTime() + gift.availableDays * GIFT_DAY_MS;
  return Date.now() < expiresAt;
};

const claimGiftToDB = async (giftId: string, userId: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const gift = await Gift.findById(giftId).session(session);
    if (!gift) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Gift not found");
    }
    if (!isAvailable(gift)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Gift is no longer available",
      );
    }

    const user = await User.findById(userId).select("point").session(session);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }
    if ((user.point ?? 0) < gift.minPoints) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Not enough points");
    }

    const alreadyClaimed = await GiftClaim.findOne({
      gift: giftId,
      user: userId,
    }).session(session);
    if (alreadyClaimed) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "You already collected this gift",
      );
    }

    const earnedPoints = gift.earnPoints;
    if (earnedPoints > 0) {
      await User.updateOne(
        { _id: userId },
        { $inc: { point: earnedPoints } },
        { session },
      );
    }

    await GiftClaim.create([{ gift: giftId, user: userId, earnedPoints }], {
      session,
    });

    const updatedUser = await User.findById(userId)
      .select("point")
      .session(session);
    await session.commitTransaction();

    return {
      gift,
      earnedPoints,
      point: updatedUser?.point ?? 0,
    };
  } catch (error) {
    await session.abortTransaction();
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "You already collected this gift",
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const GiftServices = {
  createGiftToDB,
  getAllGiftsFromDB,
  getGiftByIdFromDB,
  updateGiftByIdToDB,
  deleteGiftByIdFromDB,
  claimGiftToDB,
};
