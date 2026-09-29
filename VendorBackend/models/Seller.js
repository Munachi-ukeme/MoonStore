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
            default: "", 
        },

        tagline: {
            type: String,
            default: "",
        },
        
                whatsappNumber: {
            type: String,
            required: true,
        },

        howHeardAboutUs: {
            type: String,
            enum: ["Facebook", "Threads", "Google Search", "Referred by a friend", "Instagram", "Other"],
            required: true,
        },

        // Add to sellerSchema:
escrowPayMerchantRef: { type: String, default: null },
onboardingStatus: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
},

        howHeardAboutUsOther: {
            type: String,
            default: "",
        },

        address: {
                type: String,
                default: "",
        },

        phoneNumber: {
            type: String,
            default: "",
        },

        resetPasswordToken: { 
            type: String, 
            default: null 
        },

resetPasswordExpires: { 
    type: Date, 
    default: null 
},

    isActive: {
      type: Boolean,
      default: true, 
    },

    deactivatedAt: {
    type: Date,
    default: null,
},
reactivatedAt: {
    type: Date,
    default: null,
},

inactivityWarningSent: {
    type: Boolean,
    default: false,
},

    // Gates Products/Categories creation until admin manually verifies
    // the seller's Paystack subaccount in the admin dashboard
    subaccountVerified: {
      type: Boolean,
      default: false,
    },

 
    buyerEmails: {
    type: [String],
    default: [],
    },


},

{
        timestamps: true, // automatically adds createdAt and updatedAt
}
);

module.exports = mongoose.model("Seller", sellerSchema);