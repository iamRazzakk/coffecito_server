import { Schema, model } from "mongoose";
import { IFavorite, FavoriteModel } from "./favorite.interface";

const favoriteSchema = new Schema<IFavorite, FavoriteModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    type: {
      type: String,
      enum: ["shop", "product"],
      required: true,
    },
  },
  { timestamps: true },
);

favoriteSchema.pre("validate", function (next) {
  const hasShop = Boolean(this.shopId);
  const hasProduct = Boolean(this.productId);

  if (hasShop === hasProduct) {
    next(new Error("Provide either shopId or productId"));
    return;
  }

  this.type = hasProduct ? "product" : "shop";
  next();
});

favoriteSchema.index(
  { userId: 1, shopId: 1 },
  {
    unique: true,
    partialFilterExpression: { shopId: { $type: "objectId" } },
  },
);
favoriteSchema.index(
  { userId: 1, productId: 1 },
  {
    unique: true,
    partialFilterExpression: { productId: { $type: "objectId" } },
  },
);

export const Favorite = model<IFavorite, FavoriteModel>(
  "Favorite",
  favoriteSchema,
);
