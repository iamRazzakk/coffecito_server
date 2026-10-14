export const FAVORITE_CACHE_TTL = 60 * 60 * 24; // 1 day

export type FavoriteType = "shop" | "product";

export const favoriteUserCacheKey = (userId: string, type?: FavoriteType) =>
  type ? `favorite:user:${userId}:${type}` : `favorite:user:${userId}`;

export const favoriteItemCacheKey = (favoriteId: string) =>
  `favorite:${favoriteId}`;
