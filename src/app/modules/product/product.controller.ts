import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductServices.createProductToDB(req.body, req.user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Product created successfully",
    data: product,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await ProductServices.getAllProductsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Products fetched successfully",
    pagination: products.meta,
    data: products.data,
  });
});

const getAllProductsFilterByStatus = catchAsync(
  async (req: Request, res: Response) => {
    const products = await ProductServices.getAllProductsFilterByStatusFromDB(
      req.query,
      req.params.id,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Products fetched successfully",
      pagination: products.meta,
      data: products.data,
    });
  },
);

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductServices.getProductByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Product fetched successfully",
    data: product,
  });
});

const updateProductById = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductServices.updateProductByIdToDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Product updated successfully",
    data: product,
  });
});

const deleteProductById = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductServices.deleteProductByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Product deleted successfully",
    data: product,
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getAllProductsFilterByStatus,
  getProductById,
  updateProductById,
  deleteProductById,
};
