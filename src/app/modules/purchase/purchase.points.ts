import { ClientSession, Types } from "mongoose";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";

type PointedItem = {
  productId: Types.ObjectId;
  quantity: number;
};

export const awardPurchasePoints = async (
  userId: Types.ObjectId,
  items: PointedItem[],
  dbSession?: ClientSession,
) => {
  if (!items.length) return 0;

  const productsQuery = Product.find({
    _id: { $in: items.map((item) => item.productId) },
    point: { $gt: 0 },
  }).select("point");
  if (dbSession) productsQuery.session(dbSession);
  const products = await productsQuery;

  const pointByProduct = new Map(
    products.map((product) => [product._id.toString(), product.point ?? 0]),
  );
  const earned = items.reduce((sum, item) => {
    const point = pointByProduct.get(item.productId.toString());
    if (!point) return sum;
    return sum + point * item.quantity;
  }, 0);

  if (earned <= 0) return 0;

  await User.updateOne(
    { _id: userId },
    { $inc: { point: earned } },
    dbSession ? { session: dbSession } : undefined,
  );
  return earned;
};
