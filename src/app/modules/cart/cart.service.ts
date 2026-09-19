import { JwtPayload } from "jsonwebtoken";
import { ICart } from "./cart.interface";
import { Cart } from "./cart.model";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/queryBuilder";
import { Product } from "../product/product.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IProduct } from "../product/product.interface";

// constants
const PRICE_LOCK_MS = 24 * 60 * 60 * 1000; // 24 hours

// get current unit price
const getCurrentUnitPrice = (product: IProduct) =>
  product.discountPrice ?? product.originalPrice;

// build price lock
const buildPriceLock = (product: IProduct) => {
  const lockedUnitPrice = getCurrentUnitPrice(product);
  return {
    lockedUnitPrice,
    lockedOriginalPrice: product.originalPrice,
    lockedDiscountPrice: product.discountPrice ?? undefined,
    priceLockedUntil: new Date(Date.now() + PRICE_LOCK_MS),
  };
};

// check if price lock is valid
const isPriceLockValid = (cartItem: { priceLockedUntil?: Date }) =>
  !!cartItem.priceLockedUntil &&
  new Date(cartItem.priceLockedUntil).getTime() > Date.now();

// assert product available
const assertProductAvailable = async (productId: Types.ObjectId | string) => {
  const product = await Product.findById(productId).lean<IProduct>();
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }
  if (!product.status) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Product is currently unavailable",
    );
  }
  return product;
};

// refresh lock if expired
const refreshLockIfExpired = async (cartItem: ICart, product: IProduct) => {
  if (isPriceLockValid(cartItem)) return { refreshed: false };
  Object.assign(cartItem, buildPriceLock(product));
  return { refreshed: true };
};

// create cart in to db
const createCartInToDB = async (cart: ICart, user: JwtPayload) => {
  if (!cart.quantity || cart.quantity < 1) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Quantity must be at least 1");
  }
  const product = await Product.findById(cart?.productId).lean();
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }
  if (cart.size !== product.size) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Selected size must be ${product.size}`,
    );
  }
  if (!product.status) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Product is currently unavailable",
    );
  }
  cart.userId = new Types.ObjectId(user.id);
  const existingCartItem = await Cart.findOne({
    userId: new Types.ObjectId(user.id),
    productId: product._id,
    size: cart.size,
  });
  if (existingCartItem) {
    await refreshLockIfExpired(existingCartItem, product);
    existingCartItem.quantity += cart.quantity;
    await existingCartItem.save();
    return existingCartItem;
  }
  return Cart.create({
    productId: product._id,
    userId: new Types.ObjectId(user.id),
    size: cart.size,
    quantity: cart.quantity,
    ...buildPriceLock(product),
  });
};

// get all cart items from db
const getAllCartItemsFromDB = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const qb = new QueryBuilder(
    Cart.find({
      userId: new Types.ObjectId(user.id),
    }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .populate(["productId"], {
      productId: "productName size description image",
    });
  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};

// update cart item quantity from db
const updateCartItemQuantityFromDB = async (
  id: string,
  quantity: number,
  user: JwtPayload,
) => {
  if (!quantity || quantity < 1) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Quantity must be at least 1");
  }
  const cartItem = await Cart.findOne({
    _id: id,
    userId: new Types.ObjectId(user.id),
  });
  if (!cartItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Cart item not found");
  }
  const product = await assertProductAvailable(cartItem.productId);
  await refreshLockIfExpired(cartItem, product);
  cartItem.quantity = quantity;
  await cartItem.save();
  return cartItem;
};

// delete cart item from db
const deleteCartItemFromDB = async (id: string, user: JwtPayload) => {
  const cartItem = await Cart.findOneAndDelete({
    _id: id,
    userId: new Types.ObjectId(user.id),
  });
  if (!cartItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Cart item not found");
  }
  return cartItem;
};

export const CartServices = {
  createCartInToDB,
  getAllCartItemsFromDB,
  updateCartItemQuantityFromDB,
  deleteCartItemFromDB,
};
