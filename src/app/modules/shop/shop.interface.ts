import { Model } from "mongoose";

type IFAQ = {
  question: string;
  answer: string;
};

type IHours = {
  day: string;
  open: string;
  close: string;
};
export type IShop = {
  name: string;
  location: string;
  phone: string;
  about: string;
  image: string;
  status: string;
  faqs: IFAQ[];
  hours: IHours[];
};

export type ShopModel = Model<IShop>;
