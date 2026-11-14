// middleware/maintenance.js
const crypto = require("crypto");

// true only when the request carries the tester bypass key (MAINTENANCE_BYPASS_KEY in env)
const hasValidBypassKey = (req) => {
  const expected = process.env.MAINTENANCE_BYPASS_KEY;
  const provided = req.headers["x-maintenance-bypass"];

  if (!expected || typeof provided !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

// matches the prefix itself or anything under it, so "/api/store/test-store"
// does not also let through a store called "test-store-shop"
const matchesPrefix = (url, prefix) => {
  if (!url.startsWith(prefix)) {
    return false;
  }

  const nextChar = url.charAt(prefix.length);
  return nextChar === "" || nextChar === "/" || nextChar === "?";
};

const maintenanceMiddleware = (req, res, next) => {
  // Always let preflight OPTIONS requests through to preserve CORS
  if (req.method === "OPTIONS") {
    return next();
  }

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

  if (!isMaintenanceMode) {
    return next();
  }

  // Testers holding the secret key can use the whole site
  if (hasValidBypassKey(req)) {
    return next();
  }

  const currentUrl = req.originalUrl || req.path;

  // Static assets bypass (JS, CSS, images, etc.)
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(currentUrl);
  if (isStaticAsset) {
    return next();
  }

  // Exact whitelisted endpoints (health check and login routes)
  const exactWhitelistedPaths = [
    "/",
    "/login",
    "/auth/login",
    "/api/auth/login",
  ];

  // Prefix whitelisted endpoints (test-store pages and EscrowPay webhooks)
  const prefixWhitelistedPaths = [
    "/test-store",
    "/api/test-store",
    "/store/test-store",
    "/api/store/test-store",
    "/api/webhooks/escrowpay",
  ];

  const isExactMatch = exactWhitelistedPaths.includes(currentUrl);
  const isPrefixMatch = prefixWhitelistedPaths.some((prefix) => matchesPrefix(currentUrl, prefix));

  if (isExactMatch || isPrefixMatch) {
    return next();
  }

  // Set No-Cache headers so browsers don't cache maintenance responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  return res.status(503).json({
    success: false,
    message: "The system is under maintenance. Please try again later.",
    isMaintenance: true,
  });
};

module.exports = maintenanceMiddleware;