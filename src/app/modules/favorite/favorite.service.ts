import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { redisService } from "../../../redis/redis.service";
import { Product } from "../product/product.model";
import { Shop } from "../shop/shop.model";
import {
  FAVORITE_CACHE_TTL,
  FavoriteType,
  favoriteItemCacheKey,
  favoriteUserCacheKey,
} from "./favorite.constants";
import { IFavorite } from "./favorite.interface";
import { Favorite } from "./favorite.model";

type FavoriteTarget = {
  shopId?: string;
  productId?: string;
  type?: "shop" | "product";
};

const resolveType = (payload: FavoriteTarget): "shop" | "product" => {
  if (payload.productId) return "product";
  return "shop";
};

const clearFavoriteCache = async (userId: string, favoriteId?: string) => {
  const jobs = [
    redisService.del(favoriteUserCacheKey(userId)),
    redisService.del(favoriteUserCacheKey(userId, "shop")),
    redisService.del(favoriteUserCacheKey(userId, "product")),
  ];
  if (favoriteId) {
    jobs.push(redisService.del(favoriteItemCacheKey(favoriteId)));
  }
  await Promise.all(jobs);
};

const assertTargetExists = async (payload: FavoriteTarget) => {
  if (payload.productId) {
    const product = await Product.findById(payload.productId).select("_id");
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }
    return;
  }

  const shop = await Shop.findById(payload.shopId).select("_id");
  if (!shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
  }
};

const targetFilter = (userId: string, payload: FavoriteTarget) => {
  if (payload.productId) {
    return {
      userId,
      productId: new Types.ObjectId(payload.productId),
    };
  }

  return {
    userId,
    shopId: new Types.ObjectId(payload.shopId),
  };
};

const toggleFavoriteToDB = async (
  user: JwtPayload,
  payload: FavoriteTarget,
) => {
  const userId = user.id as string;
  await assertTargetExists(payload);

  const existing = await Favorite.findOne(targetFilter(userId, payload));
  if (existing) {
    await Favorite.deleteOne({ _id: existing._id, userId });
    await clearFavoriteCache(userId, existing._id.toString());
    return { action: "removed" as const, favorite: existing };
  }

  const type = resolveType(payload);
  const favorite = await Favorite.create({
    userId,
    type,
    ...(type === "product"
      ? { productId: payload.productId }
      : { shopId: payload.shopId }),
  });

  await clearFavoriteCache(userId);
  return { action: "added" as const, favorite };
};

const getMyFavoritesFromDB = async (
  user: JwtPayload,
  type?: FavoriteType,
) => {
  const userId = user.id as string;
  const cacheKey = favoriteUserCacheKey(userId, type);
  const cached = await redisService.get(cacheKey);

  if (cached) {
    return JSON.parse(cached) as IFavorite[];
  }

  const favorites = await Favorite.find(type ? { userId, type } : { userId })
    .populate("shopId", "name image phone status")
    .populate(
      "productId",
      "productName image discountPrice originalPrice shopId",
    )
    .lean();

  await redisService.post({
    key: cacheKey,
    value: JSON.stringify(favorites),
    expiration: FAVORITE_CACHE_TTL,
  });

  return favorites;
};

const getFavoriteByIdFromDB = async (user: JwtPayload, id: string) => {
  const cacheKey = favoriteItemCacheKey(id);
  const cached = await redisService.get(cacheKey);

  if (cached) {
    const favorite = JSON.parse(cached) as IFavorite & { _id: string };
    if (String(favorite.userId) !== user.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You can't access this favorite",
      );
    }
    return favorite;
  }

  const favorite = await Favorite.findOne({ _id: id, userId: user.id })
    .populate("shopId", "name image phone status")
    .populate(
      "productId",
      "productName image discountPrice originalPrice shopId",
    )
    .lean();

  if (!favorite) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Favorite not found");
  }

  await redisService.post({
    key: cacheKey,
    value: JSON.stringify(favorite),
    expiration: FAVORITE_CACHE_TTL,
  });

  return favorite;
};

const updateFavoriteToDB = async (
  user: JwtPayload,
  id: string,
  payload: FavoriteTarget,
) => {
  const userId = user.id as string;
  const existing = await Favorite.findOne({ _id: id, userId });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Favorite not found");
  }

  await assertTargetExists(payload);

  const duplicate = await Favorite.findOne({
    ...targetFilter(userId, payload),
    _id: { $ne: existing._id },
  }).select("_id");

  if (duplicate) {
    throw new ApiError(StatusCodes.CONFLICT, "Favorite already exists");
  }

  const type = resolveType(payload);
  const updated = await Favorite.findOneAndUpdate(
    { _id: id, userId },
    type === "product"
      ? {
          $set: { productId: payload.productId, type },
          $unset: { shopId: 1 },
        }
      : {
          $set: { shopId: payload.shopId, type },
          $unset: { productId: 1 },
        },
    { new: true, runValidators: true },
  );

  await clearFavoriteCache(userId, id);
  return updated;
};

const deleteFavoriteFromDB = async (user: JwtPayload, id: string) => {
  const userId = user.id as string;
  const favorite = await Favorite.findOneAndDelete({ _id: id, userId });
  if (!favorite) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Favorite not found");
  }

  await clearFavoriteCache(userId, id);
  return favorite;
};

export const FavoriteServices = {
  toggleFavoriteToDB,
  getMyFavoritesFromDB,
  getFavoriteByIdFromDB,
  updateFavoriteToDB,
  deleteFavoriteFromDB,
};
