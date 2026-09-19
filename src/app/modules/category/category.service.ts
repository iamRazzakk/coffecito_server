import { CategoryModel, ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategoryToDB = async (payload: ICategory) => {
  const category = await Category.create(payload);
  return category;
};

const getAllCategoriesFromDB = async () => {
  const categories = await Category.find();
  return categories;
};

const getCategoryByIdFromDB = async (id: string) => {
  const category = await Category.findById(id);
  return category;
};

const updateCategoryByIdToDB = async (id: string, payload: ICategory) => {
  const category = await Category.findByIdAndUpdate(id, payload, { new: true });
  return category;
};

const deleteCategoryByIdFromDB = async (id: string) => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  return category;
};


export const CategoryServices = {
  createCategoryToDB,
  getAllCategoriesFromDB,
  getCategoryByIdFromDB,
  updateCategoryByIdToDB,
  deleteCategoryByIdFromDB,
};
