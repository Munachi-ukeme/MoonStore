const express = require("express");
const router = express.Router();
const { getStoresSitemap } = require("../controllers/sitemapController");
 
router.get("/sitemap-stores.xml", getStoresSitemap);
 
module.exports = router;