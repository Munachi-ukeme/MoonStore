const Product = require("../models/Product")
const Category = require("../models/Category")
const { cloudinary } = require("../config/cloudinary")

// helper function - converts product name to slug
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
// GET /api/products
// -----------------------------------
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.seller._id })
      .populate("categoryId", "name")
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// ADD PRODUCT
// POST /api/products
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

    // 3. Check if slug already exists for this seller
    const existingSlug = await Product.findOne({
      sellerId: req.seller._id,
      slug
    })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // 4. Check image limit based on plan
    const imageLimits = { basic: 1, pro: 2, premium: 3 }
    const allowedImages = imageLimits[req.seller.plan]

    // 5. Handle multiple image uploads
    let images = []
    if (req.files && req.files.length > 0) {
      if (req.files.length > allowedImages) {
        return res.status(403).json({
          message: `Your ${req.seller.plan} plan allows only ${allowedImages} image(s) per product, upgrade to upload more images`
        })
      }
      images = req.files.map(file => file.path)
    }

    // 6. Create product
    const product = await Product.create({
      sellerId: req.seller._id,
      categoryId,
      name,
      price,
      description,
      images,
      slug,
    })

    res.status(201).json({
      message: "Product added successfully",
      product,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// EDIT PRODUCT
// PUT /api/products/:id
// -----------------------------------
const editProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, inStock } = req.body

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Update fields
    product.name = name || product.name
    product.price = price || product.price
    product.description = description || product.description
    product.categoryId = categoryId || product.categoryId
    product.inStock = inStock !== undefined ? inStock : product.inStock

    // If new images uploaded — delete old ones and replace
    if (req.files && req.files.length > 0) {
      const imageLimits = { basic: 1, pro: 2, premium: 3 }
      const allowedImages = imageLimits[req.seller.plan]

      if (req.files.length > allowedImages) {
        return res.status(403).json({
          message: `Your ${req.seller.plan} plan allows only ${allowedImages} image(s) per product, upgrade to upload more images`
        })
      }

      // Delete old images from Cloudinary
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`vendorstore/${publicId}`)
      }

      product.images = req.files.map(file => file.path)
    }

    // Update slug if name changed
    if (name) {
      product.slug = generateSlug(name)
    }

    const updatedProduct = await product.save()

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// DELETE PRODUCT
// DELETE /api/products/:id
// -----------------------------------
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Delete all images from Cloudinary
    for (const imageUrl of product.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0]
      await cloudinary.uploader.destroy(`vendorstore/${publicId}`)
    }

    await product.deleteOne()

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getProducts, addProduct, editProduct, deleteProduct }