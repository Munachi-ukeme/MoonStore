const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// fires when buyer place an order — notifies seller
const sendSellerNewChatEmail = async (sellerEmail, sellerBusinessName, productName) => {
    try {
        await transporter.sendMail({
            from: `"MoonStore" <${process.env.EMAIL_USER}>`,
            to: sellerEmail,
            subject: `New order on ${sellerBusinessName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #6d28d9;">You have a new order 🎉</h2>
                    <p>A buyer is interested in <strong>${productName}</strong>.</p>
                    
                    <p>Log in to your dashboard to reply.</p>
                    <a href="${process.env.FRONTEND_URL}/dashboard/inbox"
                        style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                        View Conversation
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your store, your rules.</p>
                </div>
            `,
        });
    } catch (err) {
        console.error("Seller email error:", err.message);
    }
};

// fires when seller replies after buyer has likely left (5+ minutes)
const sendBuyerReplyEmail = async (buyerEmail, sellerBusinessName, storeSlug) => {
    try {
        await transporter.sendMail({
            from: `"MoonStore" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: `${sellerBusinessName} replied to your order`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #6d28d9;">You have a reply 💬</h2>
                    <p><strong>${sellerBusinessName}</strong> has responded to your order.</p>
                    <a href="${process.env.FRONTEND_URL}/${storeSlug}"
                        style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                        View Reply
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your store, your rules.</p>
                </div>
            `,
        });
    } catch (err) {
        console.error("Buyer reply email error:", err.message);
    }
};

module.exports = { sendSellerNewChatEmail, sendBuyerReplyEmail };