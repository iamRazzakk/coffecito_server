type NamedPrice = {
  name?: string;
  additionalPrice?: number | null;
};

type PricedProduct = {
  discountPrice?: number | null;
  originalPrice: number;
  sizes?: NamedPrice[];
  extras?: NamedPrice[];
  taxPercentage?: number | null;
};

export type ProductPriceSelection = {
  size?: string | null;
  extras?: string[];
};

export type ProductPriceBreakdown = {
  basePrice: number;
  sizePrice: number;
  extrasPrice: number;
  unitPrice: number;
  taxPercentage: number;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const extraKey = (names?: string[]) =>
  [...new Set((names ?? []).map((name) => name.trim()).filter(Boolean))]
    .sort()
    .join("|");

export const extrasKeyFor = (names?: string[]) => extraKey(names);

export const selectedExtraNames = (names?: string[]) =>
  extraKey(names).split("|").filter(Boolean);

export const priceProduct = (
  product: PricedProduct,
  selection: ProductPriceSelection = {},
): ProductPriceBreakdown => {
  const basePrice =
    product.discountPrice === undefined || product.discountPrice === null
      ? product.originalPrice
      : product.discountPrice;
  const sizePrice =
    product.sizes?.find((size) => size.name === selection.size)?.additionalPrice ??
    0;
  const selectedExtraNameSet = new Set(selectedExtraNames(selection.extras));
  const extrasPrice = (product.extras ?? []).reduce((sum, extra) => {
    if (!extra.name || !selectedExtraNameSet.has(extra.name)) return sum;
    return sum + (extra.additionalPrice ?? 0);
  }, 0);
  const taxPercentage =
    product.taxPercentage == null
      ? 0
      : Math.min(Math.max(product.taxPercentage, 0), 100);

  return {
    basePrice,
    sizePrice,
    extrasPrice,
    unitPrice: roundMoney(basePrice + sizePrice + extrasPrice),
    taxPercentage,
  };
};

export const lineTax = (merchandise: number, taxPercentage = 0) => {
  if (merchandise <= 0 || taxPercentage <= 0) return 0;
  return roundMoney(
    merchandise * (Math.min(Math.max(taxPercentage, 0), 100) / 100),
  );
};

export const getProductUnitPrice = (
  product: PricedProduct,
  selection: ProductPriceSelection = {},
) => priceProduct(product, selection).unitPrice;
