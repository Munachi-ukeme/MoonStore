const Product = require("../models/Product")
const Category = require("../models/Category")
const { cloudinary } = require("../config/cloudinary")

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
}

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

const addProduct = async (req, res) => {
  try {

     if (!req.seller.subaccountVerified) {
      return res.status(403).json({
        message: "Your store is under review. Please try again once your account is verified.",
      })
    }

    const { name, price, description, categoryId, stockCount } = req.body

    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    let slug = generateSlug(name)

    const RESERVED_SLUGS = ["orders", "chat"]
    if (RESERVED_SLUGS.includes(slug)) {
      slug = `${slug}-item`
    }

    const existingSlug = await Product.findOne({
      sellerId: req.seller._id,
      slug,
    })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    let images = []
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path)
    }

    let colors = []
    let sizes = []
    if (req.body.colors) {
      colors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors
    }
    if (req.body.sizes) {
      sizes = typeof req.body.sizes === "string" ? JSON.parse(req.body.sizes) : req.body.sizes
    }

    const productData = {
      sellerId: req.seller._id,
      categoryId,
      name,
      price,
      description,
      images,
      slug,
      colors,
      sizes,
    }

    if (stockCount !== undefined && stockCount !== "") {
      productData.stockCount = Number(stockCount)
      productData.inStock = Number(stockCount) > 0
    }

    const product = await Product.create(productData)

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const editProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, inStock, stockCount } = req.body

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.sellerId.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    product.name = name || product.name
    product.price = price !== undefined ? price : product.price
    product.description = description !== undefined ? description : product.description
    product.categoryId = categoryId || product.categoryId

    if (stockCount !== undefined && stockCount !== "") {
      const newStock = Number(stockCount)
      product.stockCount = newStock
      product.inStock = newStock > 0

      // seller restocked above the low threshold — reset the notify flag
      // so a future dip to low stock sends a fresh email
      if (newStock > 5) {
        product.lowStockNotified = false
      }
    } else if (inStock !== undefined) {
      product.inStock = inStock
    }

    if (req.body.colors) {
      product.colors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors
    }

    if (req.body.sizes) {
      product.sizes = typeof req.body.sizes === "string" ? JSON.parse(req.body.sizes) : req.body.sizes
    }

    if (req.files && req.files.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`moonstore/${publicId}`).catch((err) => {
          console.error("Cloudinary deletion error:", err.message)
        })
      }

      product.images = req.files.map((file) => file.path)
    }

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

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.sellerId.toString() !== req.seller._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

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