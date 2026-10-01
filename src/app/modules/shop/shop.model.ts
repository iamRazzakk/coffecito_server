import mongoose, { model } from "mongoose";
import { SHOP_DAYS, SHOP_STATUS } from "./shop.constants";
import { IShop, ShopModel } from "./shop.interface";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const hoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: [...SHOP_DAYS],
    },
    open: { type: String, required: true },
    close: { type: String, required: true },
  },
  { _id: false },
);

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    about: { type: String, default: "" },
    image: { type: String, default: "" },
    status: {
      type: String,
      enum: [...SHOP_STATUS],
      default: "Active",
    },
    faqs: { type: [faqSchema], default: [] },
    hours: { type: [hoursSchema], default: [] },
  },
  { timestamps: true },
);

export const Shop = model<IShop, ShopModel>("Shop", shopSchema);