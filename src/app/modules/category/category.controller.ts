import { Request, Response, NextFunction } from "express";
import { CategoryServices } from "./category.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryServices.createCategoryToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Category created successfully",
    data: category,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await CategoryServices.getAllCategoriesFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Categories fetched successfully",
    data: categories,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryServices.getCategoryByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category fetched successfully",
    data: category,
  });
});

const updateCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryServices.updateCategoryByIdToDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category updated successfully",
    data: category,
  });
});

const deleteCategoryById = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryServices.deleteCategoryByIdFromDB(
    req.params.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Category deleted successfully",
    data: category,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};
