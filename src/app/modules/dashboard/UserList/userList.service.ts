import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../../builder/queryBuilder";
import ApiError from "../../../../errors/ApiErrors";
import { USER_ROLES } from "../../../../enums/user";
import { User } from "../../user/user.model";

const getAllUsersFromDB = async (query: Record<string, any>) => {
  const users = new QueryBuilder(User.find({ role: USER_ROLES.USER }), query)
    .search(["name", "phone"])
    .filter()
    .sort()
    .paginate();

  const [meta, data] = await Promise.all([
    users.getPaginationInfo(),
    users.modelQuery.exec(),
  ]);
  return { meta, data };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

const suspendUserByIdFromDB = async (id: string) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: USER_ROLES.USER },
    { isBanned: true },
    { new: true },
  );
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

const restoreUserByIdFromDB = async (id: string) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: USER_ROLES.USER },
    { isBanned: false },
    { new: true },
  );
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

export const UserListService = {
  getAllUsersFromDB,
  getUserByIdFromDB,
  suspendUserByIdFromDB,
  restoreUserByIdFromDB,
};
