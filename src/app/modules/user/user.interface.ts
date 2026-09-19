import { Model, Types } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

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
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isAccountCreated(id: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;

// need to add county
