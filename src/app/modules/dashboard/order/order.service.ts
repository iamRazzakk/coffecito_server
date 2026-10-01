import QueryBuilder from "../../../builder/queryBuilder";
import { Purchase } from "../../purchase/purchase.model";
import { User } from "../../user/user.model";

const orderOvierviewFromDB = async () => {
  const [totalOrder, completedOrder, pendinOrder, cancelledOrder] =
    await Promise.all([
      Purchase.countDocuments(),
      Purchase.countDocuments({ status: "completed" }),
      Purchase.countDocuments({ status: "pending" }),
      Purchase.countDocuments({ status: "cancelled" }),
    ]);
  return { totalOrder, completedOrder, pendinOrder, cancelledOrder };
};

const allOrderFromDB = async (query: Record<string, any>) => {
  const filter: Record<string, unknown> = {};

  if (query.searchTerm) {
    const users = await User.find({
      name: { $regex: query.searchTerm, $options: "i" },
    }).select("_id");
    filter.userId = { $in: users.map((user) => user._id) };
  }

  const orders = new QueryBuilder(Purchase.find(filter), query)
    .filter()
    .sort()
    .populate(["userId"], { userId: "name phone" })
    .paginate();

  const [meta, data] = await Promise.all([
    orders.getPaginationInfo(),
    orders.modelQuery.exec(),
  ]);
  return { meta, data };
};

export const OrderService = { orderOvierviewFromDB, allOrderFromDB };
