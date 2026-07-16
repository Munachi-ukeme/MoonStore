const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = process.env.PAYSTACK_BASE_KEY;

// this create subaccounts for every seller on paystack
const createSubaccount = async (businessName, accountNumber, bankCode) => {
    try{
        const response = await fetch(`${PAYSTACK_BASE}/subaccount`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                business_name: `MoonStore - ${businessName}`,
                settlement_bank: bankCode,
                account_number: accountNumber,
                percentage_charge: 1.5
            })
        });

        const data = await response.json();

        if (!data.status){
            return {error: data.message || "Subaccount creation failed"};
        }

        return { subaccountCode: data.data.subaccount_code};
    } catch (err) {
        return{error: "Subaccount creation failed"};
    }
};


// this extract banks list from paystack for sellers to choose
const getBanks = async (req, res) =>{
    try {
        const response = await fetch(
            `${PAYSTACK_BASE}/bank?country=nigeria&use_cursor=false&perPage=100`,
            {
                headers: {Authorization: `Bearer ${PAYSTACK_SECRET}`}
            }
        );

        const data = await response.json()

        if (!data.status) {
            return res.status(400).json({ message: "Could not fetch banks" });
        }

        const banks = data.data.map((bank) => ({
            name: bank.name,
            code: bank.code
        }));

        res.json({ banks });
    } catch (err){
        res.status(500).json({ message: "Server error"});
    }
};

//this check if the account number sellers type match the bank name they choose
const verifyAccount = async (req, res) =>{
    const { accountNumber, bankCode} = req.body;

    if (!accountNumber || !bankCode){
        return res.status(400).json({ message: "Account number and bank code are required" });
    }

    try{
        const response = await fetch(
            `${PAYSTACK_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            }
        );

        const data = await response.json();

        if (!data.status) {
            return res.status(400).json({ message: "Account not found. Check the number and bank." });
        }

        res.json({ accountName: data.data.account_name });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Called from seller dashboard — seller pays or renews their plan

const  initializePayment = async (req, res) => {
    const { plan } = req.body;

    if(!plan) {
        return res.status(400).json({ message: "Plan is required" });
    }

    const planPrices = {
        basic: 1500000,     // ₦15,000 in kobo
        pro: 3500000,       // ₦35,000 in kobo
        premium: 7500000    // ₦75,000 in kobo
    };

    const amount = planPrices[plan];

     if (!amount) {
        return res.status(400).json({ message: "Invalid plan" });
    }

     try {
        const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: req.seller.email,
                amount,
                metadata: {
                    sellerId: req.seller.id,
                    plan
                },
                callback_url: `${process.env.FRONTEND_URL}/dashboard`
            })
        });

        const data = await response.json();

        if (!data.status) {
            return res.status(400).json({ message: "Payment initialization failed" });
        }

        res.json({
            paymentUrl: data.data.authorization_url,
            reference: data.data.reference
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }

};

// Paystack calls this automatically after every successful payment
const paystackWebhook = async (req, res) => {
    const crypto = require("crypto");
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
        .createHmac("sha512", secret)
        .update(req.rawBody)
        .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
        const { metadata } = event.data;
        const sellerId = metadata?.sellerId;
        const plan = metadata?.plan;
        const conversationId = metadata?.conversationId;

        // ── subscription / activation payment ──
        if (sellerId && plan) {
            try {
                const Seller = require("../models/Seller");
                const seller = await Seller.findById(sellerId);

                if (seller) {
                    const now = new Date();
                    const end = new Date();
                    end.setDate(end.getDate() + 30);

                    seller.isActive = true;
                    seller.plan = plan;
                    seller.subscriptionStart = now;
                    seller.subscriptionEnd = end;
                    await seller.save();
                }
            } catch (err) {
                console.error("Webhook subscription update failed:", err.message);
            }
        }

        // ── order payment ──
        if (conversationId) {
            try {
                const Conversation = require("../models/Conversation");
                const Message = require("../models/Message");
                const { getIO } = require("../utils/socket");

                const conversation = await Conversation.findById(conversationId);

                if (conversation && conversation.status !== "paid") {
                    conversation.status = "paid";
                    conversation.paidAt = new Date();
                    conversation.amount = event.data.amount / 100; // kobo to naira
                    await conversation.save();

                    await Message.create({
                        conversationId: conversation._id,
                        sender: "system",
                        content: "✅ Payment confirmed. This conversation will be deleted in 7 days.",
                    });

                    try {
                        getIO().to(conversationId.toString()).emit("conversation_paid", {
                            conversationId,
                        });
                    } catch (err) {
                        console.error("Socket emit error:", err.message);
                    }
                }
            } catch (err) {
                console.error("Webhook order update failed:", err.message);
            }
        }
    }

    return res.sendStatus(200);
};

const verifyAndSyncSubscription = async (req, res) => {
    try {
        const Seller = require("../models/Seller");
        
        // Fetch the seller using the logged-in request credentials
        const seller = await Seller.findById(req.seller.id).select("-password");

        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        // Return the fresh data to overwrite the stale frontend context/localStorage
        res.json({ 
            message: "Subscription status synced", 
            seller 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error during sync" });
    }
};

module.exports = {
    getBanks,
    verifyAccount,
    initializePayment,
    paystackWebhook,
    createSubaccount,
    verifyAndSyncSubscription
};