// middleware/maintenance.js

const maintenanceMiddleware = (req, res, next) => {
  // Always let preflight OPTIONS requests through to preserve CORS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (!isMaintenanceMode) {
    return next();
  }

  // Get the normalized path (e.g., '/api/store/right-hairs' or '/store/right-hairs')
  const currentUrl = req.originalUrl || req.path;

  // Static assets bypass (JS, CSS, images, etc.)
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(currentUrl);
  if (isStaticAsset) {
    return next();
  }

  // Exact whitelisted endpoints (login routes)
  const exactWhitelistedPaths = [
    '/login',
    '/auth/login',
    '/api/auth/login'
  ];

  // Specific prefix whitelisted endpoints (only for test-store)
  const prefixWhitelistedPaths = [
    '/test-store',
    '/api/test-store',
    '/store/test-store',      // Matches fetchWithTimeout(`${BASE_URL}/store/test-store`)
    '/api/store/test-store'
  ];

  const isExactMatch = exactWhitelistedPaths.includes(currentUrl);
  const isPrefixMatch = prefixWhitelistedPaths.some((prefix) => currentUrl.startsWith(prefix));

  // If path is allowed (like login or test-store), let it pass
  if (isExactMatch || isPrefixMatch) {
    return next();
  }

  // Set No-Cache headers so browsers don't cache maintenance responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  // Block ALL other API calls (including /store/right-hairs or root API endpoints) with 503
  return res.status(503).json({
    success: false,
    message: 'The system is under maintenance. Please try again later.',
    isMaintenance: true
  });
};

module.exports = maintenanceMiddleware;