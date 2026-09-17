// middleware/maintenance.js

const maintenanceMiddleware = (req, res, next) => {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  // 1. If maintenance mode is OFF, let everything pass
  if (!isMaintenanceMode) {
    return next();
  }

  const currentPath = req.path;

  // 2. Define path rules
  const exactWhitelistedPaths = [
    '/login',
    '/api/auth/login'
  ];

  const prefixWhitelistedPaths = [
    '/test-store',
    '/api/test-store'
  ];

  // 3. Check exact matches
  const isExactMatch = exactWhitelistedPaths.includes(currentPath);

  // 4. Check prefix matches
  const isPrefixMatch = prefixWhitelistedPaths.some((prefix) => {
    return currentPath.startsWith(prefix);
  });

  // If path is allowed, pass request to the next handler
  if (isExactMatch || isPrefixMatch) {
    return next();
  }

  // 5. If path is NOT whitelisted, block the request
  // A. Handle API requests (JSON response)
  const isApiRequest = req.xhr || currentPath.startsWith('/api/') || req.headers.accept?.includes('json');

  if (isApiRequest) {
    return res.status(503).json({
      success: false,
      message: 'The system is under maintenance. Please try again later.'
    });
  }

 // B. Handle browser page navigation (HTML response with MoonStore Brand Color)
  return res.status(503).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MoonStore - Maintenance Mode</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; background-color: #f8f9fa; color: #212529; }
          .container { text-align: center; padding: 2.5rem; background: #ffffff; border-radius: 12px; border-top: 5px solid #6D28D9; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 420px; width: 90%; }
          h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; color: #6D28D9; }
          p { font-size: 0.95rem; color: #4b5563; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Under Maintenance</h1>
          <p>The system is currently undergoing upgrades to improve your checkout experience. Please check back shortly.</p>
        </div>
      </body>
    </html>
  `);
  
};

module.exports = maintenanceMiddleware;