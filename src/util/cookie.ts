import { type CookieOptions, type Response } from "express";
import { jwtHelpers } from "../helpers/jwtHelper";

export const AUTH_COOKIE_ACCESS = "access_token";
export const AUTH_COOKIE_REFRESH = "refresh_token";

const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
const COOKIE_SAME_SITE: CookieOptions["sameSite"] =
  process.env.COOKIE_SAME_SITE === "strict" ||
  process.env.COOKIE_SAME_SITE === "none" ||
  process.env.COOKIE_SAME_SITE === "lax"
    ? process.env.COOKIE_SAME_SITE
    : "lax";

export function createCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(res: Response, userId: string, role: string) {
  const accessToken = jwtHelpers.createAccessToken({ id: userId, role: role });
  const refreshToken = jwtHelpers.createRefreshToken(userId);

  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(
    AUTH_COOKIE_ACCESS,
    accessToken,
    createCookieOptions(accessMaxAge),
  );
  res.cookie(
    AUTH_COOKIE_REFRESH,
    refreshToken,
    createCookieOptions(refreshMaxAge),
  );
}

export function clearAuthCookies(res: Response) {
  const clearOptions: CookieOptions = {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  };

  res.clearCookie(AUTH_COOKIE_ACCESS, clearOptions);
  res.clearCookie(AUTH_COOKIE_REFRESH, clearOptions);
}
