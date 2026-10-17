import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import {
  extrasKeyFor,
  lineTax,
  priceProduct,
  selectedExtraNames,
} from "../product/product.utils";
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

const assertSelection = (
  product: StoredProduct,
  size: ProductSize,
  extras: string[],
) => {
  if (product.sizes?.length && !product.sizes.some((item) => item.name === size)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Selected size is not available");
  }
  extras.forEach((name) => {
    const exists = product.extras?.some((item) => item.name === name);
    if (!exists) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Extra ${name} is not available`);
    }
  });
};

const applyCatalogPrice = (cartItem: ICart, product: StoredProduct) => {
  const unitPrice = priceProduct(product, {
    size: cartItem.size,
    extras: cartItem.extras,
  }).unitPrice;
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
  const priced = hasCatalogPrice
    ? priceProduct(
        {
          discountPrice: product.discountPrice,
          originalPrice: product.originalPrice as number,
          sizes: product.sizes,
          extras: product.extras,
          taxPercentage: product.taxPercentage,
        },
        { size: cartItem.size, extras: cartItem.extras },
      )
    : null;
  const unitPrice =
    priced?.unitPrice ??
    cartItem.unitPrice ??
    cartItem.lockedUnitPrice ??
    addedUnitPrice;
  const taxPercentage = priced?.taxPercentage ?? 0;
  const taxAmount = lineTax(unitPrice * cartItem.quantity, taxPercentage);
  const available = !!product && product.status !== false;

  return {
    _id: cartItem._id,
    productId: product?._id ?? cartItem.productId,
    userId: cartItem.userId,
    shopId: product?.shopId,
    quantity: cartItem.quantity,
    size: cartItem.size,
    extras: cartItem.extras ?? [],
    addedUnitPrice,
    unitPrice,
    sizePrice: priced?.sizePrice ?? 0,
    extrasPrice: priced?.extrasPrice ?? 0,
    taxPercentage,
    taxAmount,
    lineTotal: unitPrice * cartItem.quantity + taxAmount,
    priceChanged: hasCatalogPrice ? unitPrice !== addedUnitPrice : false,
    available,
    product: product
      ? {
          productName: product.productName,
          size: cartItem.size,
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
  payload: {
    productId: string;
    size: ProductSize;
    extras?: string[];
    quantity?: number;
  },
  user: JwtPayload,
) => {
  const quantity = payload.quantity ?? 1;
  const extras = selectedExtraNames(payload.extras);
  const extrasKey = extrasKeyFor(extras);
  const product = await assertProductAvailable(payload.productId);
  assertSelection(product, payload.size, extras);
  const userId = new Types.ObjectId(user.id);
  const existingCartItem = await Cart.findOne({
    userId,
    productId: product._id,
    size: payload.size,
    ...(extrasKey
      ? { extrasKey }
      : { $or: [{ extrasKey: "" }, { extrasKey: { $exists: false } }] }),
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

  const unitPrice = priceProduct(product, {
    size: payload.size,
    extras,
  }).unitPrice;
  const cartItem = await Cart.create({
    productId: product._id,
    userId,
    size: payload.size,
    extras,
    extrasKey,
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
        "productName description image originalPrice discountPrice sizes extras taxPercentage status shopId",
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
