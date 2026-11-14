// this is a blueprint that tells MongoDB exactly what a seller's data should look like before saving it.
const mongoose = require("mongoose")

// one delivery zone a seller offers, e.g. "Within Lagos" / 2000 / 2 days
const deliveryOptionSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        estimatedDays: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
)

const sellerSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true, // no two sellers can share an email
        },

        password: {
            type: String,
            required: true, // stored hashed
        },

        slug: {
            type: String,
            required: true,
            unique: true, // e.g "chinwe-fashion" - each store URL is unique
        },

        logo: {
            type: String,
            default: "", // cloudinary URL
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

        // delivery zones the seller offers (buyers pick one per order)
        deliveryOptions: {
            type: [deliveryOptionSchema],
            default: [],
        },

        // bank account for payouts
        bankDetails: {
            accountName: {
                type: String,
                default: "",
            },
            accountNumber: {
                type: String,
                default: "",
            },
            bankName: {
                type: String,
                default: "",
            },
            bankCode: {
                type: String,
                default: "",
            },
        },

        // EscrowPay identity + payout setup
        escrowPayMerchantRef: {
            type: String,
            default: null,
        },
        payoutAccountId: {
            type: String,
            default: null,
        },
        onboardingStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },

        // disputes
        disputesAgainst: {
            type: Number,
            default: 0,
        },
        disputesLostAgainst: {
            type: Number,
            default: 0,
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
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

        cancellations: {
            type: Number,
            default: 0,
        },

        // true once identity verification and payout setup are both complete;
        // this is what unlocks Products and Categories in the dashboard
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