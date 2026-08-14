


import { grossUpPrice } from "../src/utils/pricing";
export default async function handler(req, res) {
  try {
    const { slug, productSlug } = req.query;

    const response = await fetch(`https://moonstore.onrender.com/api/store/${slug}/${productSlug}`);
    const data = await response.json();

    if (!data || data.error) {
      res.status(404).send("Product not found");
      return;
    }

    const product = data.product || data;

    const title = product.name
  ? `${product.name} — ₦${grossUpPrice(product.price).toLocaleString()}`
  : "MoonStore Product";
    const description = product.description
      ? product.description.slice(0, 150)
      : "Check out this product on MoonStore.";
    const image = product.images && product.images[0] ? product.images[0] : "https://moonstore.ng/og-image.png";
    const url = `https://moonstore.ng/${slug}/${productSlug}`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content="${url}" />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${image}" />
        </head>
        <body>
          <p>${title}</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error generating preview");
  }
}