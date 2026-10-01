import { Schema, model } from "mongoose";
import { ICategory, CategoryModel } from "./category.interface";

const categorySchema = new Schema<ICategory, CategoryModel>({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});


export const Category = model<ICategory, CategoryModel>(
  "Category",
  categorySchema,
);
