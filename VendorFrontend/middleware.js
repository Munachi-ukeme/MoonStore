export const config = {
  matcher: ["/:slug/:productSlug"],
};

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "linkedinbot",
  "telegrambot",
  "slackbot",
  "discordbot",
];

export default async function middleware(request) {
  try {
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));

    if (!isBot) {
      return;
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts.length !== 2) {
      return;
    }

    const [slug, productSlug] = pathParts;
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      return;
    }

    const response = await fetch(`${apiUrl}/api/store/${slug}/${productSlug}`);

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const product = data.product;

    if (!product) {
      return;
    }

    const image = product.images && product.images.length > 0 ? product.images[0] : "";
    const description = product.description || `₦${product.price.toLocaleString()}`;
    const pageUrl = request.url;

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(product.name)} | MoonStore</title>
  <meta property="og:title" content="${escapeHtml(product.name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:type" content="product" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(product.name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <p>${escapeHtml(product.name)}</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  } catch (err) {
    return;
  }
}