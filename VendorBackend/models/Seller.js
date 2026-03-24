//this is a blueprint that tells MongoDB exactly what a seller's data should look like before saving it.
// note: Mongoose is the tool that lets you talk to MongoDB from your Node.js code.
const mongoose = require("mongoose")

const sellerSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: true,
        },

        email: {
        type: String,
        required: true,
        unique: true, //this makes sure no two sellers have the same email
        },

        password: {
            type: String,
            required: true, //will be hashed before saving
        },

        slug: { // slug help generate a URl name with the seller business name
            type: String,
            required: true,
            unique: true, // e.g "chinwe-fashion" - each store URL is unique
        },

        logo: {
            type: String,
            default: "", //cloudinary URL
        },

        bannerImage: {
            type: String,
            default: "", // pro and premium only
        },

        tagline: {
            type: String,
            default: "",
        },
        
        whatsappNumber: {
            type: String,
            required: true,
        },

        primaryColor: {
            type: String,
            default: "#D4500A" ,//pro and premuim
        },

        secondaryColor: {
            type: String, 
            default: "#F5F0EB" //pro and premium only
        },

        plan: {
            type: String,
            enum: ["basic", "pro", "premium"],
            default: "basic",
            required: true
        },

    isActive: {
      type: Boolean,
      default: true
    },
    subscriptionEnd: {
      type: Date,
      default: null
    },

    },

    {
        timestamps: true, // automatically adds createdAt and updatedAt
    }
);

module.exports = mongoose.model("Seller", sellerSchema);