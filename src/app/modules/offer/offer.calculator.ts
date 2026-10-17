import { Types } from "mongoose";
import { DiscountKind, IOffer } from "./offer.interface";

export type OfferLine = {
  key: string;
  productId: string;
  productName: string;
  size: "S" | "M" | "L";
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxPercentage?: number;
  shopId: string;
};

export type StoredOffer = IOffer & { _id: Types.ObjectId };

export type PricedOfferLine = OfferLine & {
  payable: number;
  taxAmount: number;
};

export type OfferQuote = {
  offer: StoredOffer | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  payable: number;
  lines: PricedOfferLine[];
};

type QuoteContext = {
  now: Date;
  hasPreviousOrder: boolean;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const clampPercent = (percent = 0) => Math.min(Math.max(percent, 0), 100);

const percentDiscount = (amount: number, percent = 0) =>
  roundMoney(amount * (clampPercent(percent) / 100));

const moneyOff = (amount: number, kind: DiscountKind, value: number) => {
  if (amount <= 0 || value <= 0) return 0;
  if (kind === "percentage") return percentDiscount(amount, value);
  return roundMoney(Math.min(value, amount));
};

const idText = (id: Types.ObjectId | string) => id.toString();

const qualifyingLines = (offer: IOffer, lines: OfferLine[]) =>
  lines.filter((line) => {
    if (line.shopId !== idText(offer.shopId)) return false;
    if (!offer.productIds?.length) return true;
    return offer.productIds.some((productId) => idText(productId) === line.productId);
  });

const sumLines = (lines: OfferLine[]) =>
  roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));

const toMinutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

const dhakaClock = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: weekdayMap[read("weekday")] ?? 0,
    minutes: Number(read("hour")) * 60 + Number(read("minute")),
  };
};

const withinDates = (offer: IOffer, now: Date) => {
  if (offer.startAt && now < new Date(offer.startAt)) return false;
  if (offer.endAt && now > new Date(offer.endAt)) return false;
  return true;
};

const withinHappyHour = (offer: IOffer, now: Date) => {
  if (!offer.startTime || !offer.endTime) return false;
  const start = toMinutes(offer.startTime);
  const end = toMinutes(offer.endTime);
  if (start == null || end == null) return false;
  const clock = dhakaClock(now);
  if (offer.days?.length && !offer.days.includes(clock.day)) return false;
  if (start <= end) return clock.minutes >= start && clock.minutes <= end;
  return clock.minutes >= start || clock.minutes <= end;
};

const isScheduled = (offer: IOffer, now: Date) => {
  if (!withinDates(offer, now)) return false;
  if (offer.offerType === "HAPPY_HOUR") return withinHappyHour(offer, now);
  return true;
};

const capDiscount = (amount: number, offer: IOffer, ceiling: number) => {
  let discount = Math.max(0, roundMoney(amount));
  if (offer.maxDiscountAmount != null) {
    discount = Math.min(discount, offer.maxDiscountAmount);
  }
  return Math.min(discount, Math.max(0, ceiling));
};

const bogoDiscount = (offer: IOffer, lines: OfferLine[]) => {
  const buy = offer.buyQuantity ?? 1;
  const free = offer.getQuantity ?? 1;
  const group = buy + free;
  return lines.reduce((sum, line) => {
    const freeUnits = Math.floor(line.quantity / group) * free;
    return sum + freeUnits * line.unitPrice;
  }, 0);
};

const buyXGetPercentDiscount = (offer: IOffer, lines: OfferLine[]) => {
  const buy = offer.buyQuantity ?? 1;
  const discountedUnitsPerGroup = offer.getQuantity ?? 1;
  const group = buy + discountedUnitsPerGroup;
  return lines.reduce((sum, line) => {
    const discountedUnits =
      Math.floor(line.quantity / group) * discountedUnitsPerGroup;
    return sum + discountedUnits * line.unitPrice * (clampPercent(offer.percentOff) / 100);
  }, 0);
};

const comboDiscount = (offer: IOffer, lines: OfferLine[]) => {
  const required = (offer.comboProductIds ?? []).map(idText);
  if (required.length < 2 || offer.comboPrice == null) return 0;
  const shopLines = lines.filter((line) => line.shopId === idText(offer.shopId));
  const quantityByProduct = new Map<string, number>();
  shopLines.forEach((line) => {
    quantityByProduct.set(
      line.productId,
      (quantityByProduct.get(line.productId) ?? 0) + line.quantity,
    );
  });
  const sets = Math.min(
    ...required.map((productId) => quantityByProduct.get(productId) ?? 0),
  );
  if (sets < 1) return 0;

  let consumedTotal = 0;
  required.forEach((productId) => {
    let remaining = sets;
    const productLines = shopLines
      .filter((line) => line.productId === productId)
      .sort((left, right) => left.unitPrice - right.unitPrice);
    productLines.forEach((line) => {
      if (remaining <= 0) return;
      const taken = Math.min(remaining, line.quantity);
      consumedTotal += taken * line.unitPrice;
      remaining -= taken;
    });
  });

  return Math.max(0, roundMoney(consumedTotal - sets * offer.comboPrice));
};

const giftDiscount = (offer: IOffer, lines: OfferLine[], scoped: OfferLine[]) => {
  if (!offer.giftProductId) return { discount: 0, keys: [] as string[] };
  const scopedQuantity = scoped.reduce((sum, line) => sum + line.quantity, 0);
  const scopedSubtotal = sumLines(scoped);
  const reachedAmount =
    offer.minAmount == null || scopedSubtotal >= offer.minAmount;
  const reachedQuantity =
    offer.minQuantity == null || scopedQuantity >= offer.minQuantity;
  const hasRule = offer.minAmount != null || offer.minQuantity != null;
  if (!hasRule || !reachedAmount || !reachedQuantity) {
    return { discount: 0, keys: [] as string[] };
  }
  const giftLines = lines.filter(
    (line) =>
      line.shopId === idText(offer.shopId) &&
      line.productId === idText(offer.giftProductId as Types.ObjectId),
  );
  if (!giftLines.length) return { discount: 0, keys: [] as string[] };
  const cheapest = Math.min(...giftLines.map((line) => line.unitPrice));
  return {
    discount: cheapest,
    keys: giftLines.map((line) => line.key),
  };
};

const tierDiscount = (offer: IOffer, subtotal: number) => {
  const tier = [...(offer.tiers ?? [])]
    .sort((left, right) => right.minAmount - left.minAmount)
    .find((item) => subtotal >= item.minAmount);
  if (!tier) return 0;
  return moneyOff(subtotal, tier.discountType, tier.discountValue);
};

const discountFor = (
  offer: StoredOffer,
  lines: OfferLine[],
  context: QuoteContext,
) => {
  if (!offer.isActive || !isScheduled(offer, context.now)) return null;
  if (offer.offerType === "FIRST_ORDER" && context.hasPreviousOrder) return null;

  const scoped = qualifyingLines(offer, lines);
  if (!scoped.length && offer.offerType !== "COMBO" && offer.offerType !== "FREE_GIFT") {
    return null;
  }

  const scopedSubtotal = sumLines(scoped);
  let discount = 0;
  let keys = scoped.map((line) => line.key);

  switch (offer.offerType) {
    case "BOGO":
      discount = bogoDiscount(offer, scoped);
      break;
    case "BUY_X_GET_PERCENT":
      discount = buyXGetPercentDiscount(offer, scoped);
      break;
    case "FLAT_PERCENT":
    case "UP_TO_PERCENT":
    case "FIRST_ORDER":
    case "FLASH_SALE":
    case "HAPPY_HOUR":
    case "SEASONAL":
      discount = percentDiscount(scopedSubtotal, offer.percentOff);
      break;
    case "MIN_PURCHASE":
      if (
        offer.minAmount == null ||
        scopedSubtotal < offer.minAmount ||
        !offer.discountType
      ) {
        return null;
      }
      discount = moneyOff(scopedSubtotal, offer.discountType, offer.discountValue ?? 0);
      break;
    case "SPEND_MORE_SAVE_MORE":
      discount = tierDiscount(offer, scopedSubtotal);
      break;
    case "FREE_GIFT": {
      if (offer.productIds?.length && !scoped.length) return null;
      const basis = offer.productIds?.length
        ? scoped
        : lines.filter((line) => line.shopId === idText(offer.shopId));
      const gift = giftDiscount(offer, lines, basis);
      discount = gift.discount;
      keys = gift.keys;
      break;
    }
    case "COMBO": {
      const shopLines = lines.filter((line) => line.shopId === idText(offer.shopId));
      const required = new Set((offer.comboProductIds ?? []).map(idText));
      discount = comboDiscount(offer, shopLines);
      keys = shopLines
        .filter((line) => required.has(line.productId))
        .map((line) => line.key);
      break;
    }
    default:
      return null;
  }

  const ceiling = sumLines(lines);
  discount = capDiscount(discount, offer, ceiling);
  if (discount <= 0) return null;
  return { offer, discountAmount: discount, keys };
};

const applyDiscount = (
  lines: OfferLine[],
  keys: string[],
  discountAmount: number,
) => {
  const qualifyingLinesForDiscount = lines.filter((line) => keys.includes(line.key));
  const qualifyingMerchandise = sumLines(qualifyingLinesForDiscount);
  const offerDiscount = Math.min(
    Math.max(0, roundMoney(discountAmount)),
    qualifyingMerchandise,
  );
  let remainingOfferDiscount = offerDiscount;
  const merchandisePayableByLine = new Map<string, number>();

  qualifyingLinesForDiscount.forEach((line, index) => {
    const isLastQualifyingLine = index === qualifyingLinesForDiscount.length - 1;
    const lineDiscount = isLastQualifyingLine
      ? Math.min(remainingOfferDiscount, line.lineTotal)
      : Math.min(
          roundMoney(
            qualifyingMerchandise === 0
              ? 0
              : (line.lineTotal / qualifyingMerchandise) * offerDiscount,
          ),
          line.lineTotal,
          remainingOfferDiscount,
        );
    remainingOfferDiscount = roundMoney(remainingOfferDiscount - lineDiscount);
    merchandisePayableByLine.set(
      line.key,
      roundMoney(Math.max(0, line.lineTotal - lineDiscount)),
    );
  });

  return lines.map((line) => ({
    ...line,
    payable: merchandisePayableByLine.get(line.key) ?? line.lineTotal,
  }));
};

export const quoteOffers = (
  lines: OfferLine[],
  offers: StoredOffer[],
  context: QuoteContext,
): OfferQuote => {
  const subtotal = sumLines(lines);
  const ranked = offers
    .map((offer) => discountFor(offer, lines, context))
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
    .sort((left, right) => right.discountAmount - left.discountAmount);
  const bestOffer = ranked[0];
  const linesAfterOffer = bestOffer
    ? applyDiscount(lines, bestOffer.keys, bestOffer.discountAmount)
    : lines.map((line) => ({ ...line, payable: line.lineTotal }));
  const merchandiseAfterOffer = roundMoney(
    linesAfterOffer.reduce((sum, line) => sum + line.payable, 0),
  );
  const offerDiscountAmount = roundMoney(
    Math.max(0, subtotal - merchandiseAfterOffer),
  );
  return {
    offer: bestOffer?.offer ?? null,
    subtotal,
    discountAmount: offerDiscountAmount,
    taxAmount: 0,
    payable: merchandiseAfterOffer,
    lines: linesAfterOffer.map((line) => ({ ...line, taxAmount: 0 })),
  };
};

export const buildStripeLineItems = (lines: PricedOfferLine[]) => {
  const stripeLineItems: { name: string; quantity: number; unitAmount: number }[] = [];
  lines.forEach((line) => {
    const payableCents = Math.max(0, Math.round(line.payable * 100));
    if (payableCents === 0 || line.quantity < 1) return;
    const unitAmountCents = Math.floor(payableCents / line.quantity);
    const remainderCents = payableCents - unitAmountCents * line.quantity;
    const productLabel = `${line.productName} (${line.size})`;
    if (unitAmountCents > 0) {
      stripeLineItems.push({
        name: productLabel,
        quantity: line.quantity,
        unitAmount: unitAmountCents,
      });
    }
    if (remainderCents > 0) {
      stripeLineItems.push({
        name: `${productLabel} adjustment`,
        quantity: 1,
        unitAmount: remainderCents,
      });
    }
  });
  return stripeLineItems;
};
