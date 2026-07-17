export default async function handler(req, res) {
  try {
    const { slug, productSlug } = req.query;
    const apiUrl = process.env.API_URL;

    const response = await fetch(`${apiUrl}/api/store/${slug}/${productSlug}`);
    if (!response.ok) {
      res.status(404).send("Not found");
      return;
    }

    const data = await response.json();
    const product = data.product;
    if (!product) {
      res.status(404).send("Not found");
      return;
    }

    const image = product.images && product.images.length > 0 ? product.images[0] : "";
    const description = product.description || `₦${product.price.toLocaleString()}`;
    const pageUrl = `https://moonstore.ng/${slug}/${productSlug}`;

    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(product.name)} | MoonStore</title>
<meta property="og:title" content="${esc(product.name)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:type" content="product" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(product.name)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body><p>${esc(product.name)}</p></body>
</html>`;

    res.setHeader("content-type", "text/html");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("Error");
  }
}