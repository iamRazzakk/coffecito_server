import { Model, Types } from "mongoose";

export type IFavorite = {
  shopId?: Types.ObjectId;
  productId?: Types.ObjectId;
  userId: Types.ObjectId;
  type: "shop" | "product";
};

export type FavoriteModel = Model<IFavorite>;
