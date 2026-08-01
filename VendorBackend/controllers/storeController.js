const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")
const Review = require("../models/Review")
const {cloudinary} = require("../config/cloudinary")

// -----------------------------------
// GET FULL STORE BY SLUG
// GET /api/store/:slug (public - no auth needed)
// -----------------------------------
const getStore = async (req, res) => {
  try {
    const seller = await Seller.findOne({ slug: req.params.slug }).select(
      "-password"
    )

    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    if (!seller.isActive) {
      return res.status(403).json({ 
        message: "This store is currently inactive" 
      })
    }

    const categories = await Category.find({ sellerId: seller._id })

    const products = await Product.find({ sellerId: seller._id })
      .populate("categoryId", "name")

    const reviews = await Review.find({ sellerId: seller._id })
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    res.json({
      store: {
         _id: seller._id,
        businessName: seller.businessName,
        slug: seller.slug,
        logo: seller.logo,
        bannerImage: seller.bannerImage,
        tagline: seller.tagline,
        whatsappNumber: seller.whatsappNumber,
        plan: seller.plan,
        address: seller.address,
        phoneNumber: seller.phoneNumber,
        averageRating,
        totalReviews,
      },
      categories,
      products,
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// GET SINGLE PRODUCT BY SLUG
// GET /api/store/:slug/:productSlug (public - no auth needed)
// -----------------------------------
const getProduct = async (req, res) => {
  try {
    const seller = await Seller.findOne({ slug: req.params.slug })
    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    if (!seller.isActive) {
      return res.status(403).json({ message: "This store is currently inactive" })
    }

    const product = await Product.findOne({
      sellerId: seller._id,
      slug: req.params.productSlug,
    }).populate("categoryId", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({
      product,
      store: {
        businessName: seller.businessName,
        whatsappNumber: seller.whatsappNumber,
        slug: seller.slug,
      },
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }

}

  //UPDATE STORE SETTINGS
  //PUT /api/store/settings (protected - seller only)

  const updateSettings = async (req, res) =>{
    try{
      const seller = await Seller.findById(req.seller.id)

      if (!seller){
        return res.status(404).json({ message: "Seller not found"})
      }

      if (req.body.businessName) {
        seller.businessName = req.body.businessName
      }

      if (req.body.tagline !== undefined) {
        seller.tagline = req.body.tagline
      }

      if (req.body.whatsappNumber) {
        seller.whatsappNumber = req.body.whatsappNumber
      }

      if(req.body.address !== undefined){
        seller.address = req.body.address
      }

      if(req.body.phoneNumber !== undefined){
        seller.phoneNumber = req.body.phoneNumber
      }

      if(!seller.bankDetails) seller.bankDetails = {};
      if(req.body.accountName !== undefined){
        seller.bankDetails.accountName = req.body.accountName
      }

      if (req.body.accountNumber !== undefined){
        seller.bankDetails.accountNumber =req.body.accountNumber
      }

      if (req.body.bankName !== undefined) {
        seller.bankDetails.bankName = req.body.bankName
      }

      if (req.files && req.files.logo && req.files.logo.length > 0){
        const logoResult = await cloudinary.uploader.upload(
          req.files.logo[0].path,
          {
            folder: "moonstore",
          }
        )
        seller.logo = logoResult.secure_url
      }

      if(req.files && req.files.bannerImage  && req.files.bannerImage.length > 0) {
          const bannerResult = await cloudinary.uploader.upload(
            req.files.bannerImage[0].path,
            {
              folder: "moonstore"
            }
          )
          seller.bannerImage = bannerResult.secure_url
      }

      await seller.save()

      res.json({
        message: "Store settings updated successfully",
        seller: {
          businessName: seller.businessName,
          tagline: seller.tagline,
          whatsappNumber: seller.whatsappNumber,
          address: seller.address,
          logo: seller.logo,
          bannerImage: seller.bannerImage,
          plan: seller.plan,
          slug: seller.slug,
          bankDetails: seller.bankDetails,
        },
      })


    } catch(error){
      res.status(500).json({ message: error.message})
    }
    
}

module.exports = { getStore, getProduct, updateSettings }