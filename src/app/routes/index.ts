import express from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { ProductRoutes } from "../modules/product/product.routes";
import { CartRoutes } from "../modules/cart/cart.routes";
import { CouponCodeRoutes } from "../modules/coupon_code/coupon_code.routes";
import { RuleRoutes } from "../modules/rule/rule.route";
import { PurchaseRoutes } from "../modules/purchase/purchase.routes";
import { OverviewRoutes } from "../modules/dashboard/overview/overview.routes";
import { OrderRoutes } from "../modules/dashboard/order/order.routes";
import { UserListRoutes } from "../modules/dashboard/UserList/userList.routes";
import { SupportRoutes } from "../modules/dashboard/support/support.routes";
import { ShopRoutes } from "../modules/shop/shop.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
const router = express.Router();

const apiRoutes = [
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/category", route: CategoryRoutes },
  { path: "/product", route: ProductRoutes },
  { path: "/cart", route: CartRoutes },
  { path: "/coupon-code", route: CouponCodeRoutes },
  { path: "/rule", route: RuleRoutes },
  { path: "/purchase", route: PurchaseRoutes },
  { path: "/dashboard", route: OverviewRoutes },
  { path: "/dashboard", route: OrderRoutes },
  { path: "/dashboard/user-list", route: UserListRoutes },
  { path: "/support", route: SupportRoutes },
  { path: "/shop", route: ShopRoutes },
  { path: "/notification", route: NotificationRoutes },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
