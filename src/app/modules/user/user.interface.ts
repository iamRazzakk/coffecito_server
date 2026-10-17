import { Model } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

export type IContactInfo = {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
};

// Main User interface
export type IUser = {
  name: string;
  phone: string;
  birthDate: Date;
  image: string;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  role: USER_ROLES;
  point?: number;
  contactInfo?: IContactInfo;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isAccountCreated(id: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;

// need to add county
