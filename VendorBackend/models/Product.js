// product blueprint -  each product belongs to a specific seller and category
const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId, // links to a seller document
            ref: "Seller",
            required: true,
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId, // links to a category document
            ref: "Category",
            required: true,
        },

        name: {
            type: String,
            required: true, // e.g "Ankara Gown"
        },

        price: {
            type: Number,
            required: true, // e.g 15000
        },

        description: {
            type: String,
            default: "",
        },

        images: {
            type: [String], // array of cloudinary URLs
            default: [],
            //Basic: 1 images, pro: 2 images, Premium: 3 images
        },

        inStock: {
            type: Boolean,
            default: true, // product is available by default
        },

        slug: {
            type: String,
            required: true, // e.g "ankara-gown" -> individual product URL
        },
    },

    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Product", productSchema)