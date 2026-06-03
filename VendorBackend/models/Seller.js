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


        plan: {
            type: String,
            enum: ["basic", "pro", "premium"],
            default: "basic",
        },

        address: {
                type: String,
                default: "",
        },

        phoneNumber: {
            type: String,
            default: "",
        },

    isActive: {
      type: Boolean,
      default: false, // store is not active by default when created
    },

    subscriptionStart: {
      type: Date,
      default: null, // set when seller first pays
    },

    subscriptionEnd: {
      type: Date,
      default: null, // null until i activate their subscription
    },

    //referral field
    referralCode: {
        type: String,
        unique: true,
        sparse: true, //allow multiple null values without unique conflict
    },

    referredBy:{
    type: String,
    default: null,
    },

    //commission fields
    commissionBalance:{
        type: Number,
        default: 0,
    },

    totalEarned: {
        type: Number,
        default: 0,
    },

    totalPaid:{
        type: Number,
        default: 0,
    },

    paystackSubaccountCode: {
        type: String,
        default: null
    },

    buyerEmails: {
    type: [String],
    default: [],
    },


    // bank details for commission payout
    bankDetails: {
        accountName: {
            type: String,
            default: "",
        },

        accountNumber: {
            type: String,
            default: ""
        },

        bankName: {
            type: String,
            default: "",
        },

        bankCode: {
            type: String,
            default: ""
        },
    },

},

{
        timestamps: true, // automatically adds createdAt and updatedAt
}
);

module.exports = mongoose.model("Seller", sellerSchema);