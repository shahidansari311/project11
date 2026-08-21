const isProduction = process.env.NODE_ENV === "production";

/**
 * Standard cookie configuration:
 * - httpOnly: true (prevents JS access, protecting against XSS)
 * - secure: true in production (strictly sent over HTTPS only)
 * - sameSite: "none" in production (for x-origin requests with HTTPS) or "lax" in dev
 * - path: "/" (available on all routes)
 */
const getCookieOptions = (maxAgeMs) => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
};

// 15 minutes for access token (matches JWT_EXPIRES_IN)
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;

// 7 days for refresh token (matches REFRESH_TOKEN_EXPIRES_IN)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Set both Access Token and Refresh Token as HttpOnly + Secure (HTTPS) cookies on response
 */
function setAuthCookies(res, { token, refreshToken }) {
  if (token) {
    res.cookie("accessToken", token, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie("token", token, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  }

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
  }
}

/**
 * Clear authentication cookies on logout
 */
function clearAuthCookies(res) {
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  res.clearCookie("accessToken", clearOptions);
  res.clearCookie("token", clearOptions);
  res.clearCookie("refreshToken", clearOptions);
}

/**
 * Extract tokens seamlessly from cookies OR authorization headers
 */
function extractTokenFromRequest(req) {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.split(" ")[1];
    if (bearerToken) return bearerToken;
  }

  // 2. Check cookies
  if (req.cookies) {
    if (req.cookies.accessToken) return req.cookies.accessToken;
    if (req.cookies.token) return req.cookies.token;
  }

  return null;
}

/**
 * Extract refreshToken from cookies OR request body
 */
function extractRefreshToken(req) {
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }
  return null;
}

module.exports = {
  getCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  extractTokenFromRequest,
  extractRefreshToken,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
};