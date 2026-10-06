import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { IShop } from "./shop.interface";
import { Shop } from "./shop.model";
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { USER_ROLES } from "../../../enums/user";
import mongoose from "mongoose";
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

const getAllShopsFromDB = async (query: Record<string, any>) => {
  const shops = new QueryBuilder(Shop.find(), query)
    .search(["name", "location"])
    .filter()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    shops.modelQuery.exec(),
    shops.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getShopByIdFromDB = async (id: string) => {
  const shop = await Shop.findById(id);
  if (!shop) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Shop not found");
  }
  return shop;
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

export const ShopServices = {
  createShopToDB,
  getAllShopsFromDB,
  getShopByIdFromDB,
  updateShopByIdToDB,
  deleteShopByIdFromDB,
};
