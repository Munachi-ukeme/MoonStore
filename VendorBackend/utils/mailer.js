const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendSellerNewChatEmail = async (sellerEmail, sellerBusinessName, productNames) => {
  try {
    let productListHtml;
    if (Array.isArray(productNames) && productNames.length > 1) {
      const items = productNames
        .map((name) => `<li>${name}</li>`)
        .join("");
      productListHtml = `<p>A buyer is interested in these products:</p><ul style="padding-left:20px;">${items}</ul>`;
    } else {
      const singleName = Array.isArray(productNames) ? productNames[0] : productNames;
      productListHtml = `<p>A buyer is interested in <strong>${singleName}</strong>.</p>`;
    }

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: `New order on ${sellerBusinessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">You have a new order 🎉</h2>
          ${productListHtml}
          <p>Log in to your dashboard to reply.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/inbox"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            View Conversation
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore, Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Seller email error:", err.message);
  }
};

const sendBuyerReplyEmail = async (buyerEmail, sellerBusinessName, storeSlug, sessionId) => {
  try {
    const restoreLink = `${process.env.FRONTEND_URL}/restore?sid=${sessionId}&store=${storeSlug}`;
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
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
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer reply email error:", err.message);
  }
};

const sendPasswordResetEmail = async (sellerEmail, sellerBusinessName, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Reset your MoonStore password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Reset your password</h2>
          <p>Hi ${sellerBusinessName}, click below to set a new password. This link expires in 5 minutes.</p>
          <a href="${resetLink}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Password reset email error:", err.message);
  }
};

const sendSubaccountVerifiedEmail = async (sellerEmail, sellerBusinessName) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Your MoonStore account is now fully active",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">You're all set! ✅</h2>
          <p>Hi ${sellerBusinessName}, your account has been verified. You can now add products and categories to your store.</p>
          <a href="${process.env.FRONTEND_URL}/login"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Login to add your first product
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Subaccount verified email error:", err.message);
  }
};

const sendSignupConfirmationEmail = async (email, businessName, signupToken) => {
  try {
    const confirmLink = `${process.env.FRONTEND_URL}/register?token=${signupToken}`;
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: email,
      subject: "Confirm your email to finish creating your MoonStore",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Confirm your email</h2>
          <p>Hi ${businessName}, click below to confirm your email and continue setting up your store. This link expires in 10 minutes.</p>
          <a href="${confirmLink}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Confirm Email & Continue
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Signup confirmation email error:", err.message);
  }
};

const sendCommissionPaidEmail = async (sellerEmail, sellerBusinessName, amountPaid) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Your MoonStore referral commission has been paid",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">You've been paid! 💰</h2>
          <p>Hi ${sellerBusinessName}, your referral commission of <strong>₦${amountPaid.toLocaleString()}</strong> has been sent to your bank account.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            View Your Dashboard
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your store, your rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Commission paid email error:", err.message);
  }
};

module.exports = { sendSellerNewChatEmail, sendBuyerReplyEmail, sendPasswordResetEmail, sendSubaccountVerifiedEmail, sendSignupConfirmationEmail, sendCommissionPaidEmail };