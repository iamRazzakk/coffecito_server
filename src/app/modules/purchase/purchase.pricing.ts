import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { ICouponCode } from "../coupon_code/coupon_code.interface";
import { OfferQuote, PricedOfferLine } from "../offer/offer.calculator";

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const clampPercent = (percent: number) => Math.min(Math.max(percent, 0), 100);

export type CheckoutPrice = {
  merchandiseSubtotal: number;
  offerDiscountAmount: number;
  couponDiscountAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  payableAmount: number;
  lines: PricedOfferLine[];
};

const couponDiscountFor = (
  coupon: ICouponCode,
  merchandiseAfterOffer: number,
) => {
  if (!coupon.isActive) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon is not active");
  }
  if (coupon.expireDate && new Date(coupon.expireDate).getTime() < Date.now()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Coupon has expired");
  }
  if (
    coupon.minOrderAmount != null &&
    merchandiseAfterOffer < coupon.minOrderAmount
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Order amount is below the coupon minimum",
    );
  }

  const discountValue = coupon.percentage;
  const rawDiscount =
    coupon.discountType === "percentage"
      ? roundMoney(merchandiseAfterOffer * (clampPercent(discountValue) / 100))
      : roundMoney(Math.max(discountValue, 0));
  const discountWithFloor =
    coupon.minDiscountAmount != null
      ? Math.max(rawDiscount, coupon.minDiscountAmount)
      : rawDiscount;

  return Math.min(Math.max(0, roundMoney(discountWithFloor)), merchandiseAfterOffer);
};

const spreadDiscount = (lines: PricedOfferLine[], discountAmount: number) => {
  const merchandiseBase = roundMoney(
    lines.reduce((sum, line) => sum + line.payable, 0),
  );
  const couponDiscount = Math.min(
    Math.max(0, roundMoney(discountAmount)),
    merchandiseBase,
  );
  let remainingDiscount = couponDiscount;

  return lines.map((line, index) => {
    const isLastLine = index === lines.length - 1;
    const share = isLastLine
      ? Math.min(remainingDiscount, line.payable)
      : Math.min(
          roundMoney(
            merchandiseBase === 0
              ? 0
              : (line.payable / merchandiseBase) * couponDiscount,
          ),
          line.payable,
          remainingDiscount,
        );
    remainingDiscount = roundMoney(remainingDiscount - share);
    return {
      ...line,
      payable: roundMoney(Math.max(0, line.payable - share)),
    };
  });
};

const addTaxAfterDiscount = (lines: PricedOfferLine[]) => {
  let taxAmount = 0;
  const linesWithTax = lines.map((line) => {
    const taxableMerchandise = Math.max(0, line.payable);
    const taxPercentage = clampPercent(line.taxPercentage ?? 0);
    const lineTaxAmount =
      taxableMerchandise > 0 && taxPercentage > 0
        ? roundMoney(taxableMerchandise * (taxPercentage / 100))
        : 0;
    taxAmount += lineTaxAmount;
    return {
      ...line,
      taxAmount: lineTaxAmount,
      payable: roundMoney(taxableMerchandise + lineTaxAmount),
    };
  });
  return { linesWithTax, taxAmount: roundMoney(taxAmount) };
};

export const finalizeCheckoutPrice = (
  offerQuote: OfferQuote,
  coupon: ICouponCode | null,
): CheckoutPrice => {
  const merchandiseSubtotal = offerQuote.subtotal;
  const offerDiscountAmount = offerQuote.discountAmount;
  const merchandiseAfterOffer = offerQuote.payable;
  const couponDiscountAmount = coupon
    ? couponDiscountFor(coupon, merchandiseAfterOffer)
    : 0;
  const linesAfterCoupon = spreadDiscount(offerQuote.lines, couponDiscountAmount);
  const taxableAmount = roundMoney(
    linesAfterCoupon.reduce((sum, line) => sum + line.payable, 0),
  );
  const { linesWithTax, taxAmount } = addTaxAfterDiscount(linesAfterCoupon);
  const payableAmount = roundMoney(Math.max(0, taxableAmount + taxAmount));

  return {
    merchandiseSubtotal,
    offerDiscountAmount,
    couponDiscountAmount,
    discountAmount: roundMoney(offerDiscountAmount + couponDiscountAmount),
    taxableAmount,
    taxAmount,
    payableAmount,
    lines: linesWithTax,
  };
};
