export const config = {
  matcher: ["/:slug/:productSlug"],
};

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
];

export default async function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";

  const isBot = BOT_USER_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );

  if (!isBot) {
    return;
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts.length !== 2) {
    return;
  }

  const slug = pathParts[0];
  const productSlug = pathParts[1];

  try {
    const apiUrl = process.env.API_URL;
    const response = await fetch(`${apiUrl}/api/store/${slug}/${productSlug}`);

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const product = data.product;

    if (!product) {
      return;
    }

    const image =
      product.images && product.images.length > 0 ? product.images[0] : "";
    const description = product.description || `₦${product.price.toLocaleString()}`;
    const pageUrl = request.url;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${product.name} | MoonStore</title>
  <meta property="og:title" content="${product.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="product" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <p>${product.name}</p>
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