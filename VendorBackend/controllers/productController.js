const Product = require("../models/Product")
const Category = require("../models/Category")
const { cloudinary } = require("../config/cloudinary")

// Helper function - converts product name to slug
// "Ankara Gown" → "ankara-gown"
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
}

// -----------------------------------
// GET ALL PRODUCTS
// GET /api/products (protected - seller only)
// -----------------------------------
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.seller._id }).populate(
      "categoryId",
      "name"
    )
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// ADD PRODUCT
// POST /api/products (protected - seller only)
// -----------------------------------
const addProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId } = req.body

    // 1. Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // 2. Generate slug from product name
    let slug = generateSlug(name)

    const RESERVED_SLUGS = ["orders", "chat"]
    if (RESERVED_SLUGS.includes(slug)) {
      slug = `${slug}-item`
    }

    // 3. Check if slug already exists for this seller
    const existingSlug = await Product.findOne({
      sellerId: req.seller._id,
      slug,
    })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // 4. Map uploaded images (image count limit enforced by checkImageLimit middleware)
    let images = []
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path)
    }

    // Parse colors and sizes safely
    let colors = []
    let sizes = []
    if (req.body.colors) {
      colors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors
    }
    if (req.body.sizes) {
      sizes = typeof req.body.sizes === "string" ? JSON.parse(req.body.sizes) : req.body.sizes
    }

    // 5. Create product
    const product = await Product.create({
      sellerId: req.seller._id,
      categoryId,
      name,
      price,
      description,
      images,
      slug,
      colors,
      sizes,
    })

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// EDIT PRODUCT
// PUT /api/products/:id (protected - seller only)
// -----------------------------------
const editProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, inStock } = req.body

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.sellerId.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Update fields
    product.name = name || product.name
    product.price = price !== undefined ? price : product.price
    product.description = description !== undefined ? description : product.description
    product.categoryId = categoryId || product.categoryId
    product.inStock = inStock !== undefined ? inStock : product.inStock

    if (req.body.colors) {
      product.colors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors
    }

    if (req.body.sizes) {
      product.sizes = typeof req.body.sizes === "string" ? JSON.parse(req.body.sizes) : req.body.sizes
    }

    // Handle new images (image limit enforced by checkImageLimit middleware)
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`moonstore/${publicId}`).catch((err) => {
          console.error("Cloudinary deletion error:", err.message)
        })
      }

      product.images = req.files.map((file) => file.path)
    }

    // Update slug if name changed
    if (name && name !== product.name) {
      let slug = generateSlug(name)
      const RESERVED_SLUGS = ["orders", "chat"]
      if (RESERVED_SLUGS.includes(slug)) {
        slug = `${slug}-item`
      }

      const existingSlug = await Product.findOne({
        sellerId: req.seller._id,
        slug,
        _id: { $ne: product._id },
      })

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`
      }

      product.slug = slug
    }

    const updatedProduct = await product.save()

    res.json(updatedProduct)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// DELETE PRODUCT
// DELETE /api/products/:id (protected - seller only)
// -----------------------------------
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.sellerId.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Delete images from Cloudinary
    for (const imageUrl of product.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0]
      await cloudinary.uploader.destroy(`moonstore/${publicId}`).catch((err) => {
        console.error("Cloudinary deletion error:", err.message)
      })
    }

    await product.deleteOne()

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getProducts, addProduct, editProduct, deleteProduct }