import colors from "colors";
import { User } from "../app/modules/user/user.model";
import config from "../config";
import { USER_ROLES } from "../enums/user";
import { logger } from "../shared/logger";

const superUser = {
  name: "Super Admin", // put client first name
  role: USER_ROLES.SUPER_ADMIN,
  phone: "+8801717171717",
  password: "123456",
  birthDate: new Date(),
  isVerified: true,
};

const seedSuperAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    role: USER_ROLES.SUPER_ADMIN,
  });

  if (!isExistSuperAdmin) {
    await User.create(superUser);
    logger.info(colors.green("✔ Super admin created successfully!"));
  }
};

export default seedSuperAdmin;
