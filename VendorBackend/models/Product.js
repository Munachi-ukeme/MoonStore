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

        colors: {
        type: [String],
        default: [], // e.g ["Red", "Blue", "Black"]
        },
        
        sizes: {
        type: [String],
        default: [], // e.g ["S", "M", "L", "XL"]
         },

        description: {
            type: String,
            default: "",
        },

        images: {
            type: [String], // array of cloudinary URLs
            default: [],
            
        },

        inStock: {
            type: Boolean,
            default: true, 
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

productSchema.index({ sellerId: 1})

productSchema.index({ sellerId: 1, slug: 1})

productSchema.index({sellerId: 1, categoryId: 1})

module.exports = mongoose.model("Product", productSchema)