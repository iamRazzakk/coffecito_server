import { Model } from "mongoose";

export type ICategory = {
  name: string;
  isActive: boolean;
};

export type CategoryModel = Model<ICategory>;
