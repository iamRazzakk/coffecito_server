import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { IShop } from "./shop.interface";
import { Shop } from "./shop.model";

const createShopToDB = async (payload: IShop) => {
  const shop = await Shop.create(payload);
  return shop;
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
