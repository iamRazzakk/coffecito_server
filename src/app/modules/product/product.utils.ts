type PricedProduct = {
  discountPrice?: number | null;
  originalPrice: number;
};

export const getProductUnitPrice = (product: PricedProduct) => {
  if (product.discountPrice === undefined || product.discountPrice === null) {
    return product.originalPrice;
  }
  return product.discountPrice;
};
