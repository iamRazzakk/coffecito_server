import { Model, Types } from "mongoose";

export type ProductSize = "S" | "M" | "L";

export type CartQuantityAction = "increment" | "decrement";

export type ICart = {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  size: ProductSize;
  quantity: number;
  addedUnitPrice: number;
  unitPrice: number;
  lockedUnitPrice?: number;
};

export type CartModel = Model<ICart>;

export type CartProductSnapshot = {
  _id: Types.ObjectId;
  productName?: string;
  size?: ProductSize;
  description?: string;
  image?: string;
  originalPrice?: number;
  discountPrice?: number | null;
  status?: boolean;
  shopId?: Types.ObjectId;
};

export type CartItemView = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  shopId?: Types.ObjectId;
  quantity: number;
  size?: ProductSize;
  addedUnitPrice: number;
  unitPrice: number;
  lineTotal: number;
  priceChanged: boolean;
  available: boolean;
  product: {
    productName?: string;
    size?: ProductSize;
    description?: string;
    image?: string;
    originalPrice?: number;
    discountPrice?: number | null;
    status?: boolean;
  } | null;
};
