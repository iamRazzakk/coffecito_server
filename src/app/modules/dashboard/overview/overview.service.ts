import { USER_ROLES } from "../../../../enums/user";
import { Purchase } from "../../purchase/purchase.model";
import { User } from "../../user/user.model";


const getOverViewDataFromDB = async () => {
  const [totalActiveUser, totalOrder, revenueRows] = await Promise.all([
    User.countDocuments({
      role: USER_ROLES.USER,
      isActive: true,
    }),
    Purchase.countDocuments(),
    Purchase.aggregate([
      { $match: { status: { $in: ["confirmed", "delivered"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]),
  ]);
  const totalAcitveShop = 0; // TODO: get total active shop
  return {
    totalActiveUser,
    totalOrder,
    totalRevenue: revenueRows[0]?.totalRevenue ?? 0,
    totalAcitveShop,
  };
};



const getRevenueOverViewBaseTheMonth = async () => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = new Date().getFullYear();

  const rows = await Purchase.aggregate([
    {
      $match: {
        status: { $in: ["confirmed", "delivered"] },
        createdAt: {
          $gte: new Date(`${year}-01-01T00:00:00+06:00`),
          $lt: new Date(`${year + 1}-01-01T00:00:00+06:00`),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%m",
            date: "$createdAt",
            timezone: "Asia/Dhaka",
          },
        },
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  return monthNames.map((month, index) => {
    const key = String(index + 1).padStart(2, "0");
    const found = rows.find((row: any) => row._id === key);
    return { month, totalRevenue: found?.totalRevenue ?? 0 };
  });
};

const getPurchaseOverviewFromDB = async () => {
  const [
    totalPendingOrder,
    totalConfirmedOrder,
    totalCancelledOrder,
    totalOrder,
  ] = await Promise.all([
    Purchase.countDocuments({ status: "pending" }),
    Purchase.countDocuments({ status: { $in: ["confirmed", "delivered"] } }),
    Purchase.countDocuments({ status: "cancelled" }),
    Purchase.countDocuments(),
  ]);
  return {
    totalPendingOrder,
    totalConfirmedOrder,
    totalCancelledOrder,
    totalOrder,
  };
};

const heightSellingProductFromDB = async () => {
  return Purchase.aggregate([
    { $match: { status: { $in: ["confirmed", "delivered"] } } },
    { $project: { cartId: 1 } },
    { $unwind: "$cartId" },
    {
      $lookup: {
        from: "carts",
        localField: "cartId",
        foreignField: "_id",
        as: "cart",
      },
    },
    { $unwind: "$cart" },
    {
      $group: {
        _id: "$cart.productId",
        unitsSold: { $sum: "$cart.quantity" },
        revenue: {
          $sum: { $multiply: ["$cart.lockedUnitPrice", "$cart.quantity"] },
        },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        pipeline: [{ $project: { productName: 1, categoryId: 1, size: 1 } }],
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1 } }],
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        product: {
          $concat: ["$product.productName", " (", "$product.size", ")"],
        },
        category: { $ifNull: ["$category.name", ""] },
        unitsSold: 1,
        revenue: 1,
      },
    },
  ]);
};

const getRevinewFromAllAndCurrentMonth = async () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const monthStart = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+06:00`,
  );
  const nextMonthStart =
    month === 12
      ? new Date(`${year + 1}-01-01T00:00:00+06:00`)
      : new Date(
          `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+06:00`,
        );

  const [row] = await Purchase.aggregate([
    { $match: { status: { $in: ["confirmed", "delivered"] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        thisMonthRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", monthStart] },
                  { $lt: ["$createdAt", nextMonthStart] },
                ],
              },
              "$amount",
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    totalRevenue: row?.totalRevenue ?? 0,
    thisMonthRevenue: row?.thisMonthRevenue ?? 0,
  };
};

export const OverviewServices = {
  getOverViewDataFromDB,
  getRevenueOverViewBaseTheMonth,
  getPurchaseOverviewFromDB,
  heightSellingProductFromDB,
  getRevinewFromAllAndCurrentMonth,
};
