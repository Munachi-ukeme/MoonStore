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

        // frozen copy of what was ordered, used to resolve disputes
        orderedProductSnapshot: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                name: {
                    type: String,
                    default: "",
                },
                price: {
                    type: Number,
                    default: 0,
                },
                image: {
                    type: String,
                    default: "",
                },
                colors: {
                    type: [String],
                    default: [],
                },
                sizes: {
                    type: [String],
                    default: [],
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],

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
        lastMessage: {
            type: String,
            default: "",
        },
        buyerLastMessageAt: {
            type: Date,
            default: null,
        },
        lastBuyerNotifiedAt: {
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
        // ESCROW & FULFILLMENT
        // ==========================================
        escrowStatus: {
            type: String,
            enum: ["pending", "held", "released", "disputed", "refunded"],
            default: "pending",
        },
        escrowTransactionId: {
            type: String,
            default: null,
        },
        marketplaceCommissionBps: {
            type: Number,
            default: null,
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
        shippedAt: {
            type: Date,
            default: null,
        },
        deliveryWindowDays: {
            type: Number,
            default: 0,
        },
        deliveredAt: {
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

        // release / refund tracking (used by the retry system)
        releaseId: {
            type: String,
            default: null,
        },
        releaseRequestedAt: {
            type: Date,
            default: null,
        },
        releaseRetryPending: {
            type: Boolean,
            default: false,
        },
        releaseRetryCount: {
            type: Number,
            default: 0,
        },
        refundId: {
            type: String,
            default: null,
        },
        refundRequestedAt: {
            type: Date,
            default: null,
        },
        refundRetryPending: {
            type: Boolean,
            default: false,
        },
        refundRetryCount: {
            type: Number,
            default: 0,
        },

         // checkout / payment details (they expire after 30 minutes and can be refreshed)
        checkoutSessionId: {
            type: String,
            default: null,
        },
        checkoutHostedUrl: {
            type: String,
            default: null,
        },
        
        checkoutPublicToken: {
            type: String,
            default: null,
        },
        paymentExpiresAt: {
            type: Date,
            default: null,
        },

        // stable idempotency keys so a retried call after a timeout cannot post twice
        releasedAmountMinor: {
            type: Number,
            default: null,
        },
        releaseIdemKey: {
            type: String,
            default: null,
        },
        refundIdemKey: {
            type: String,
            default: null,
        },

        // paying the seller's bank account after a release
        payoutId: {
            type: String,
            default: null,
        },
        payoutRequestedAt: {
            type: Date,
            default: null,
        },
        payoutIdemKey: {
            type: String,
            default: null,
        },
        payoutAmountMinor: {
            type: Number,
            default: null,
        },
        payoutStatus: {
            type: String,
            default: "",
        },
        payoutRetryPending: {
            type: Boolean,
            default: false,
        },
        payoutRetryCount: {
            type: Number,
            default: 0,
        },

        // reminder sent to the buyer before the automatic payout
        releaseReminderSentAt: {
            type: Date,
            default: null,
        },

        // set when the seller cancels before shipping
        cancelledBy: {
            type: String,
            enum: [null, "seller"],
            default: null,
        },
        cancelReason: {
            type: String,
            default: "",
        },
        cancelledAt: {
            type: Date,
            default: null,
        },

        dispute: {
            reason: { type: String, default: "" },
            raisedBy: { type: String, enum: [null, "buyer", "seller"], default: null },
            raisedAt: { type: Date, default: null },
            notifiedAt: { type: Date, default: null },
            responseDeadline: { type: Date, default: null },
            resolvedAt: { type: Date, default: null },
            resolutionNotes: { type: String, default: "" },
            resolution: { type: String, enum: ["", "released_to_seller", "refunded_to_buyer"], default: "" },
            autoResolved: { type: Boolean, default: false },
            category: { type: String, default: "" },
            answers: {
                riderCalled: { type: String, default: "" },
                someoneElseReceived: { type: String, default: "" },
                addressUsed: { type: String, default: "" },
            },
        },

        
        deliveryPin: {
            type: String,
            default: null,
        },
        deliveryPinAttempts: {
            type: Number,
            default: 0,
        },
        deliveryPinLockedUntil: {
            type: Date,
            default: null,
        },

        // buyer's chosen delivery zone, plus the delivery person added by the seller when shipping
        shippingDetails: {
            selectedOption: {
                label: {
                    type: String,
                    default: "",
                },
                estimatedDays: {
                    type: Number,
                    default: 0,
                },
            },
            deliveryFee: {
                type: Number,
                default: 0,
            },
            shippingStatus: {
                type: String,
                default: "",
            },
            riderName: {
                type: String,
                default: "",
            },
            riderPhone: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ sellerId: 1 });
conversationSchema.index({ buyerSessionId: 1 });
conversationSchema.index({ sellerId: 1, status: 1 });


// cron + webhook lookups
conversationSchema.index({ escrowStatus: 1, autoReleaseAt: 1 });
conversationSchema.index({ escrowTransactionId: 1 });
conversationSchema.index({ releaseId: 1 });
conversationSchema.index({ refundId: 1 });
conversationSchema.index({ payoutId: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);