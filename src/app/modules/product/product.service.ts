import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import { IProduct } from "./product.interface";
import { Product } from "./product.model";
import ApiError from "../../../errors/ApiErrors";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

const createProductToDB = async (payload: IProduct, user: JwtPayload) => {
  payload.shopId = new Types.ObjectId(user.id);
  const product = await Product.create(payload);
  return product;
};

const getAllProductsFromDB = async (query: Record<string, any>) => {
  const qb = new QueryBuilder(Product.find(), query)
    .filter()
    .fields()
    .sort()
    .paginate()
    .populate(["categoryId"], {});

  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};
const getAllProductsFilterByStatusFromDB = async (
  query: Record<string, any>,
  id: string,
) => {
  const product = await Product.findOne({ status: true, categoryId: id });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }
  const qb = new QueryBuilder(
    Product.find({ status: true, categoryId: id }),
    query,
  )
    .filter()
    .fields()
    .sort()
    .paginate()
    .populate(["categoryId"], {});

  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};

const getProductByIdFromDB = async (id: string) => {
  const product = await Product.findById(id).populate("categoryId");
  return product;
};

const updateProductByIdToDB = async (
  id: string,
  payload: Partial<IProduct>,
) => {
  const product = await Product.findByIdAndUpdate(id, payload, { new: true });
  return product;
};

const deleteProductByIdFromDB = async (id: string) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: false },
    { new: true },
  );
  return product;
};

export const ProductServices = {
  createProductToDB,
  getAllProductsFromDB,
  getAllProductsFilterByStatusFromDB,
  getProductByIdFromDB,
  updateProductByIdToDB,
  deleteProductByIdFromDB,
};
