import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { getProductUnitPrice } from "../product/product.utils";
import { IProduct } from "../product/product.interface";
import { Product } from "../product/product.model";
import {
  CartItemView,
  CartProductSnapshot,
  CartQuantityAction,
  ICart,
  ProductSize,
} from "./cart.interface";
import { Cart } from "./cart.model";

type StoredProduct = IProduct & { _id: Types.ObjectId };

const assertProductAvailable = async (productId: Types.ObjectId | string) => {
  const product = await Product.findById(productId).lean<StoredProduct>();
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

const rememberedUnitPrice = (cartItem: ICart) =>
  cartItem.addedUnitPrice ?? cartItem.lockedUnitPrice ?? cartItem.unitPrice;

const applyCatalogPrice = (cartItem: ICart, product: StoredProduct) => {
  const unitPrice = getProductUnitPrice(product);
  cartItem.unitPrice = unitPrice;
  cartItem.lockedUnitPrice = unitPrice;
  if (cartItem.addedUnitPrice == null) {
    cartItem.addedUnitPrice = cartItem.lockedUnitPrice ?? unitPrice;
  }
  return unitPrice;
};

const isPopulatedProduct = (
  productId: ICart["productId"] | CartProductSnapshot,
): productId is CartProductSnapshot =>
  Boolean(productId) &&
  typeof productId === "object" &&
  "originalPrice" in productId;

const toCartItemView = (
  cartItem: ICart & { _id: Types.ObjectId },
  product: CartProductSnapshot | StoredProduct | null,
): CartItemView => {
  const addedUnitPrice = rememberedUnitPrice(cartItem);
  const hasCatalogPrice =
    !!product && typeof product.originalPrice === "number";
  const unitPrice = hasCatalogPrice
    ? getProductUnitPrice({
        discountPrice: product.discountPrice,
        originalPrice: product.originalPrice as number,
      })
    : (cartItem.unitPrice ?? cartItem.lockedUnitPrice ?? addedUnitPrice);
  const available = !!product && product.status !== false;

  return {
    _id: cartItem._id,
    productId: product?._id ?? cartItem.productId,
    userId: cartItem.userId,
    shopId: product?.shopId,
    quantity: cartItem.quantity,
    size: product?.size ?? cartItem.size,
    addedUnitPrice,
    unitPrice,
    lineTotal: unitPrice * cartItem.quantity,
    priceChanged: hasCatalogPrice ? unitPrice !== addedUnitPrice : false,
    available,
    product: product
      ? {
          productName: product.productName,
          size: product.size,
          description: product.description,
          image: product.image,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          status: product.status,
        }
      : null,
  };
};

const createCartInToDB = async (
  payload: { productId: string; size: ProductSize; quantity?: number },
  user: JwtPayload,
) => {
  const quantity = payload.quantity ?? 1;
  const product = await assertProductAvailable(payload.productId);
  const userId = new Types.ObjectId(user.id);
  const existingCartItem = await Cart.findOne({
    userId,
    productId: product._id,
    size: payload.size,
  });

  if (existingCartItem) {
    existingCartItem.quantity += quantity;
    applyCatalogPrice(existingCartItem, product);
    await existingCartItem.save();
    return {
      created: false,
      cart: toCartItemView(existingCartItem, product),
    };
  }

  const unitPrice = getProductUnitPrice(product);
  const cartItem = await Cart.create({
    productId: product._id,
    userId,
    size: payload.size,
    quantity,
    addedUnitPrice: unitPrice,
    unitPrice,
    lockedUnitPrice: unitPrice,
  });

  return {
    created: true,
    cart: toCartItemView(cartItem, product),
  };
};

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
      productId:
        "productName size description image originalPrice discountPrice status shopId",
    });

  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);

  const items = data.map((cartItem) => {
    const product = isPopulatedProduct(cartItem.productId)
      ? cartItem.productId
      : null;
    return toCartItemView(cartItem, product);
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    data: items,
    meta,
    subtotal,
  };
};

const updateCartItemQuantityFromDB = async (
  id: string,
  payload: { action?: CartQuantityAction; quantity?: number },
  user: JwtPayload,
) => {
  const cartItem = await Cart.findOne({
    _id: id,
    userId: new Types.ObjectId(user.id),
  });
  if (!cartItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Cart item not found");
  }

  if (payload.action === "decrement") {
    const step = payload.quantity ?? 1;
    const nextQuantity = cartItem.quantity - step;
    if (nextQuantity < 1) {
      await cartItem.deleteOne();
      return { removed: true, cart: null };
    }
    cartItem.quantity = nextQuantity;
    const product = await Product.findById(
      cartItem.productId,
    ).lean<StoredProduct>();
    if (product?.status) {
      applyCatalogPrice(cartItem, product);
    }
    await cartItem.save();
    return {
      removed: false,
      cart: toCartItemView(cartItem, product),
    };
  }

  if (payload.action === "increment") {
    cartItem.quantity += payload.quantity ?? 1;
  } else if (payload.quantity) {
    cartItem.quantity = payload.quantity;
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Send an action or a quantity");
  }

  const product = await assertProductAvailable(cartItem.productId);
  applyCatalogPrice(cartItem, product);
  await cartItem.save();
  return {
    removed: false,
    cart: toCartItemView(cartItem, product),
  };
};

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
