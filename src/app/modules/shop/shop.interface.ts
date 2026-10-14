import { Model } from "mongoose";
import { IContactInfo } from "../user/user.interface";

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
  phone: string;
  about: string;
  image: string;
  status: string;
  faqs: IFAQ[];
  hours: IHours[];
  contactInfo: IContactInfo;
};

export type ShopModel = Model<IShop>;
