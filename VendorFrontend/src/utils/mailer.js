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
const sendBuyerReplyEmail = async (buyerEmail, sellerBusinessName, storeSlug, sessionId) => {
    try {

        const restoreLink = `${process.env.FRONTEND_URL}/restore?sid=${sessionId}&store=${storeSlug}`;
        await transporter.sendMail({
            from: `"MoonStore" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: `${sellerBusinessName} replied to your order`,
            html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #6d28d9;">You have a reply 💬</h2>
                    <p><strong>${sellerBusinessName}</strong> has responded to your order.</p>
                     <a href="${restoreLink}"
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

const sendBuyerClaimedPaymentEmail = async (sellerEmail, sellerSlug, conversationId) => {
  const chatLink = `${process.env.FRONTEND_URL}/${sellerSlug}/chat/${conversationId}`;

  const mailOptions = {
    from: `"MoonStore" <${process.env.GMAIL_USER}>`,
    to: sellerEmail,
    subject: "A buyer has claimed payment — please confirm",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #6c47ff;">Payment Claim Received</h2>
        <p>A buyer in one of your chats has clicked <strong>"I Have Paid"</strong>.</p>
        <p>Please check your bank account or MoonStore subaccount to verify the transfer, then open the chat and click <strong>Mark as Paid</strong> to confirm.</p>
        <a href="${chatLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6c47ff; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Open Chat
        </a>
        <p style="margin-top: 24px; color: #888; font-size: 13px;">If you did not expect this, you can ignore this email or report the conversation from within the chat.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendSellerNewChatEmail, sendBuyerReplyEmail,  sendBuyerClaimedPaymentEmail };