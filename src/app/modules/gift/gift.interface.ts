import { Model } from "mongoose";

export type IGift = {
  image: string;
  minPoints: number;
  description: string;
  createDate: Date;
  availableDays: number;
  collectLocation: string;
};

export type GiftModel = Model<IGift>;
