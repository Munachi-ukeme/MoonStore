// Category blueprint - each category belongs to a specific seller

const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId, // links to seller document
            ref: "Seller", // tells mongoose this ID belongs to the seller model
            required: true,
        },

        name: {
            type: String,
            required: true, // e.g "Tops", "Bags"
        },
    },

    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Category", categorySchema)