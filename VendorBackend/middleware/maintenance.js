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

  const currentUrl = req.originalUrl || req.path;

  // Static assets bypass
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map)$/i.test(currentUrl);
  if (isStaticAsset) {
    return next();
  }

  // Whitelisted paths
  const exactWhitelistedPaths = ['/login', '/api/auth/login'];
  const prefixWhitelistedPaths = ['/test-store', '/api/test-store'];

  const isExactMatch = exactWhitelistedPaths.includes(currentUrl);
  const isPrefixMatch = prefixWhitelistedPaths.some((prefix) => currentUrl.startsWith(prefix));

  if (isExactMatch || isPrefixMatch) {
    return next();
  }

  // Set No-Cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  // Return JSON for all API calls
  return res.status(503).json({
    success: false,
    message: 'The system is under maintenance. Please try again later.',
    isMaintenance: true
  });
};

module.exports = maintenanceMiddleware;