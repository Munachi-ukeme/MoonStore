const Seller = require("../models/Seller");
 
const getStoresSitemap = async (req, res) => {
  try {
    const sellers = await Seller.find(
      { isActive: true },
      { slug: 1, updatedAt: 1, _id: 0 }
    ).lean();
 
    const urls = sellers
      .map((seller) => {
        const lastmod = seller.updatedAt
          ? new Date(seller.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
 
        return `
  <url>
    <loc>https://moonstore.ng/${seller.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("");
 
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
 
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24 hours
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
};
 
module.exports = { getStoresSitemap };