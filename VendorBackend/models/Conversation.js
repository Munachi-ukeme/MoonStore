const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        buyerSessionId: {
            type: String,
            required: true,
        },
        buyerEmail: {
            type: String,
            default: null,
        },
        buyerPhone: {
            type: String,
            default: "",
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },
        productIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        productQuantities: {
            type: Map,
            of: Number,
            default: {},
        },
        status: {
            type: String,
            enum: ["active", "paid"],
            default: "active",
        },
        amount: {
            type: Number,
            default: 0,
        },
        buyerName: {
            type: String,
            default: "",
        },
        deliveryAddress: {
            type: String,
            default: "",
        },
        deliveryCity: {
            type: String,
            default: "",
        },
        deliveryPhone: {
            type: String,
            default: "",
        },
        paidAt: {
            type: Date,
            default: null,
        },
       paymentReference: {
    type: String,
    default: null,
},
        lastMessage: {
            type: String,
            default: "",
        },
        buyerLastMessageAt: {
            type: Date,
            default: null,
        },
        isReported: {
            type: Boolean,
            default: false,
        },
        reportReason: {
            type: String,
            default: "",
        },

        // ==========================================
        // ESCROW & FULFILLMENT FIELDS
        // ==========================================
        escrowStatus: {
            type: String,
            enum: ["pending", "held", "released", "disputed", "refunded"],
            default: "pending",
        },
        shippedAt: {
            type: Date,
            default: null,
        },
        deliveryWindowDays: {
            type: Number,
            default: 0,
        },

        orderStage: {
    type: String,
    enum: [
        "awaiting_payment",
        "payment_held",
        "shipped",
        "delivered",
        "released",
        "disputed",
        "refunded",
    ],
    default: "awaiting_payment",
},
shipDeadlineAt: {
    type: Date,
    default: null,
},

        autoReleaseAt: {
            type: Date,
            default: null,
        },
        releasedAt: {
            type: Date,
            default: null,
        },
        dispute: {
            reason: {
                type: String,
                default: "",
            },
            raisedAt: {
                type: Date,
                default: null,
            },
            resolvedAt: {
                type: Date,
                default: null,
            },
            resolutionNotes: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Existing Indexes
conversationSchema.index({ sellerId: 1 });
conversationSchema.index({ buyerSessionId: 1 });
conversationSchema.index({ sellerId: 1, status: 1 });

// Cron & Escrow Index (optimizes hourly queries)
conversationSchema.index({ escrowStatus: 1, autoReleaseAt: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);