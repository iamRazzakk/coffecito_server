import { Category } from "../../category/category.model";
import { Product } from "../../product/product.model";
import { Purchase } from "../../purchase/purchase.model";
import { Shop } from "../../shop/shop.model";
import { User } from "../../user/user.model";
import { SupportTicket } from "../support/support.model";

const TIMEZONE = "Asia/Dhaka";
const COMPLETED_STATUSES = ["confirmed", "delivered"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type CountRow = { _id: string | null; count: number };

const countByStatus = (rows: CountRow[]) =>
  rows.reduce<Record<string, number>>((acc, row) => {
    if (row._id) acc[row._id] = row.count;
    return acc;
  }, {});

const currentMonthRange = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const pad = (value: number) => String(value).padStart(2, "0");

  const start = new Date(`${year}-${pad(month)}-01T00:00:00+06:00`);
  const end =
    month === 12
      ? new Date(`${year + 1}-01-01T00:00:00+06:00`)
      : new Date(`${year}-${pad(month + 1)}-01T00:00:00+06:00`);
  return { start, end };
};

const getRevenueAndOrders = async () => {
  const { start, end } = currentMonthRange();

  const [result] = await Purchase.aggregate([
    {
      $facet: {
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        totals: [
          { $match: { status: { $in: COMPLETED_STATUSES } } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$amount" },
              thisMonthRevenue: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$createdAt", start] },
                        { $lt: ["$createdAt", end] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
        ],
        byMonth: [
          { $match: { status: { $in: COMPLETED_STATUSES } } },
          {
            $group: {
              _id: {
                year: { $year: { date: "$createdAt", timezone: TIMEZONE } },
                month: { $month: { date: "$createdAt", timezone: TIMEZONE } },
              },
              totalRevenue: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ],
      },
    },
  ]);

  const statuses = countByStatus(result?.statusCounts ?? []);
  const totals = result?.totals?.[0];
  const total = Object.values(statuses).reduce((sum, count) => sum + count, 0);

  return {
    revenue: {
      totalRevenue: totals?.totalRevenue ?? 0,
      thisMonthRevenue: totals?.thisMonthRevenue ?? 0,
      byMonth: (result?.byMonth ?? []).map(
        (row: { _id: { month: number }; totalRevenue: number }) => ({
          month: MONTH_NAMES[row._id.month - 1],
          totalRevenue: row.totalRevenue ?? 0,
        }),
      ),
    },
    orders: {
      total,
      completed: COMPLETED_STATUSES.reduce(
        (sum, status) => sum + (statuses[status] ?? 0),
        0,
      ),
      pending: statuses.pending ?? 0,
      cancelled: statuses.cancelled ?? 0,
    },
  };
};

const getTopProducts = async () => {
  const rows = await Purchase.aggregate([
    { $match: { status: { $in: COMPLETED_STATUSES } } },
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
    { $limit: 5 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        pipeline: [{ $project: { productName: 1, categoryId: 1 } }],
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
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
        product: { $ifNull: ["$product.productName", ""] },
        category: { $ifNull: ["$category.name", ""] },
        unitsSold: { $ifNull: ["$unitsSold", 0] },
        revenue: { $ifNull: ["$revenue", 0] },
      },
    },
  ]);
  return rows;
};

const getUsers = async () => {
  const [result] = await User.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$isActive", true] },
                  { $ne: ["$isBanned", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] },
        },
        suspended: {
          $sum: { $cond: [{ $eq: ["$isBanned", true] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    total: result?.total ?? 0,
    active: result?.active ?? 0,
    pending: result?.pending ?? 0,
    suspended: result?.suspended ?? 0,
  };
};

const getReportFromDB = async () => {
  const [
    revenueAndOrders,
    shopRows,
    totalProducts,
    totalCategories,
    topProducts,
    users,
    supportRows,
  ] = await Promise.all([
    getRevenueAndOrders(),
    Shop.aggregate<CountRow>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Product.countDocuments(),
    Category.countDocuments(),
    getTopProducts(),
    getUsers(),
    SupportTicket.aggregate<CountRow>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const shops = countByStatus(shopRows);
  const support = countByStatus(supportRows);
  const sum = (counts: Record<string, number>) =>
    Object.values(counts).reduce((total, count) => total + count, 0);

  return {
    revenue: revenueAndOrders.revenue,
    orders: revenueAndOrders.orders,
    shops: {
      total: sum(shops),
      active: shops.Active ?? 0,
      maintenance: shops.Maintenance ?? 0,
      inactive: shops.Inactive ?? 0,
    },
    products: {
      total: totalProducts,
      categories: totalCategories,
      top: topProducts,
    },
    users,
    support: {
      total: sum(support),
      open: support.Open ?? 0,
      pending: support.Pending ?? 0,
      resolved: support.Resolved ?? 0,
    },
  };
};

export const ReportServices = { getReportFromDB };
