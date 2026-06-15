const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")
const {cloudinary} = require("../config/cloudinary")

// -----------------------------------
// GET FULL STORE BY SLUG
// GET /api/store/:slug (public - no auth needed)
// -----------------------------------
const getStore = async (req, res) => {
  try {
    // 1. Find seller by slug
    const seller = await Seller.findOne({ slug: req.params.slug }).select(
      "-password" // never send password to frontend
    )

    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    // 2. check if store is active
if (!seller.isActive) {
  return res.status(403).json({ 
    message: "This store is currently inactive" 
  })
}

    // 3. Get all categories for this store
    const categories = await Category.find({ sellerId: seller._id })

    // 4. Get all products for this store
    const products = await Product.find({ sellerId: seller._id })
      .populate("categoryId", "name")

    // 5. Return everything in one response
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
    // 1. Find seller by slug
    const seller = await Seller.findOne({ slug: req.params.slug })
    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    //Safety check so buyers cannot browse single product pages of expired/inactive stores
    if (!seller.isActive) {
      return res.status(403).json({ message: "This store is currently inactive" })
    }

    // 2. Find product by slug
    const product = await Product.findOne({
      sellerId: seller._id,
      slug: req.params.productSlug,
    }).populate("categoryId", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // 3. Return product + store info (needed for OG tags and WhatsApp number)
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
      ///1. find the seller from the JWT token
      const seller = await Seller.findById(req.seller.id)

      if (!seller){
        return res.status(404).json({ message: "Seller not found"})
      }

      //2. Update basic fields if they were sent
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

      // bank details
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

      //4. Upload logo to cloudinary if a new one was sent
      if (req.files && req.files.logo && req.files.logo.length > 0){
        const logoResult = await cloudinary.uploader.upload(
          req.files.logo[0].path,
          {
            folder: "moonstore",
          }
        )
        seller.logo = logoResult.secure_url
      }

      //5. Upload banner
      if(req.files && req.files.bannerImage  && req.files.bannerImage.length > 0) {
          const bannerResult = await cloudinary.uploader.upload(
            req.files.bannerImage[0].path,
            {
              folder: "moonstore"
            }
          )
          seller.bannerImage = bannerResult.secure_url
      }

      //6. save updated seller to mongoDB
      await seller.save()

      //7. Return updated seller without password
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