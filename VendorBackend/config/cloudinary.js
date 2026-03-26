const cloudinary = require("cloudinary").v2 //import cloudinary latest version

const { CloudinaryStorage } = require("multer-storage-cloudinary") //This connects Multer and Cloudinary together. Multer receives the uploaded file from the request, CloudinaryStorage sends it directly to Cloudinary.

const multer = require("multer") //Multer is a middleware that handles file uploads in Express. Without it the backend can't receive image files from the frontend.

// Connect to Cloudinary using your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure where and how images are stored
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "moonstore", // images go into this folder on Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
})

// Multer handles the file upload before sending to Cloudinary
const upload = multer({ storage })

module.exports = { cloudinary, upload }