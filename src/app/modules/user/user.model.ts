import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^[+]?[1-9]\d{1,14}$/, "Please provide a valid phone number!"],
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: false,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    image: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// for fast lookup
userSchema.index({ phone: 1 });
// if filtering by role often
userSchema.index({ role: 1 });
//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByPhone = async (phone: string) => {
  const isExist = await User.findOne({ phone });
  return isExist;
};

//account check
userSchema.statics.isAccountCreated = async (id: string) => {
  const isUserExist: any = await User.findById(id);
  return isUserExist.accountInformation.status;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre("save", async function (next) {
  //check user
  const isExist = await User.findOne({ phone: this.phone });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number already exist!");
  }
  next();
});
export const User = model<IUser, UserModal>("User", userSchema);
