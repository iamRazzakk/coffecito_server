import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { IShop } from "./shop.interface";
import { Shop } from "./shop.model";
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { USER_ROLES } from "../../../enums/user";
import mongoose, { Types } from "mongoose";
import { Product } from "../product/product.model";
import { JwtPayload } from "jsonwebtoken";
import { Favorite } from "../favorite/favorite.model";
// create shop in to db
const createShopToDB = async (payload: IShop) => {
  const isExist = await User.findOne({ phone: payload.phone });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number already exist!");
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const [user] = await User.create(
      [
        {
          name: payload.name,
          phone: payload.phone,
          birthDate: new Date(),
          isActive: true,
          isBanned: false,
          isVerified: true,
          role: USER_ROLES.SHOP_OWNER,
          image: payload.image,
          contactInfo: payload.contactInfo,
        },
      ],
      { session },
    );
    const [shop] = await Shop.create([payload], { session });
    await session.commitTransaction();
    return shop;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllShopsFromDB = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const shops = new QueryBuilder(Shop.find(), query)
    .search(["name", "contactInfo.location.coordinates"])
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    shops.modelQuery.lean().exec(),
    shops.getPaginationInfo(),
  ]);

  const favoriteShopIds = await Favorite.find({
    userId: user.id,
    type: "shop",
    shopId: { $in: data.map((shop: any) => shop._id) },
  }).distinct("shopId");
  const favoriteSet = new Set(favoriteShopIds.map(String));

  return {
    data: data.map((shop: any) => ({
      ...shop,
      isFavorite: favoriteSet.has(String(shop._id)),
    })),
    meta,
  };
};

const getShopByIdFromDB = async (id: string, user: JwtPayload) => {
  const shop = await Shop.findById(id).lean();
  if (!shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
  }

  const isFavorite = Boolean(
    await Favorite.exists({ userId: user.id, shopId: shop._id }),
  );

  return { ...shop, isFavorite };
};

const updateShopByIdToDB = async (id: string, payload: Partial<IShop>) => {
  const shop = await Shop.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
  }
  return shop;
};

const deleteShopByIdFromDB = async (id: string) => {
  const shop = await Shop.findByIdAndUpdate(
    id,
    { status: "Inactive" },
    { new: true },
  );
  if (!shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
  }
  return shop;
};

const getAllShopProductBasedOnCategoryIdFromDB = async (
  shopId: string,
  categoryId: string,
  query: Record<string, any>,
) => {
  const qb = new QueryBuilder(
    Product.find({
      shopId: new Types.ObjectId(shopId),
      categoryId: new Types.ObjectId(categoryId),
      status: true,
    }),
    query,
  )
    .filter()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);
  return { data, meta };
};

export const ShopServices = {
  createShopToDB,
  getAllShopsFromDB,
  getShopByIdFromDB,
  updateShopByIdToDB,
  deleteShopByIdFromDB,
  getAllShopProductBasedOnCategoryIdFromDB,
};
