import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { IDirectPurchasePayload, IProduct } from "./product.interface";
import { lineTax, priceProduct, roundMoney, selectedExtraNames } from "./product.utils";

type DirectPurchaseProduct = Pick<
  IProduct,
  | "productName"
  | "originalPrice"
  | "discountPrice"
  | "sizes"
  | "extras"
  | "taxPercentage"
>;

export const prepareDirectPurchase = (
  product: DirectPurchaseProduct,
  payload: IDirectPurchasePayload,
) => {
  const quantity = payload.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Quantity must be a positive integer",
    );
  }

  const size = payload.size ?? product.sizes?.[0]?.name;
  if (!size || !product.sizes?.some((item) => item.name === size)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "A valid product size is required",
    );
  }

  const extras = selectedExtraNames(payload.extras);
  const validExtras = new Set((product.extras ?? []).map((item) => item.name));
  if (extras.some((extra) => !validExtras.has(extra))) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "One or more extras are invalid",
    );
  }

  const pricing = priceProduct(product, { size, extras });
  const subtotal = roundMoney(pricing.unitPrice * quantity);
  const taxAmount = lineTax(subtotal, pricing.taxPercentage);
  const amount = roundMoney(subtotal + taxAmount);
  const chargedCents = Math.round(amount * 100);

  if (chargedCents < 50) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Payable amount is below the minimum card charge",
    );
  }

  return {
    quantity,
    size,
    subtotal,
    taxAmount,
    amount,
    chargedCents,
    unitPrice: pricing.unitPrice,
    stripeLineItem: {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: chargedCents,
        product_data: { name: `${product.productName} x ${quantity}` },
      },
    },
  };
};
