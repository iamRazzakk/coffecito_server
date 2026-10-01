import { Model } from "mongoose";

export type ICategory = {
  name: string;
  image: string;
  isActive: boolean;
};

export type CategoryModel = Model<ICategory>;
