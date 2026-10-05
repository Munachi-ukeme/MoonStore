const { Resend } = require("resend");
const { sendAdminDisputeMessage } = require("../../VendorFrontend/src/api/api");

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


const sendLowStockEmail = async (sellerEmail, sellerBusinessName, productName, stockLeft) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: `Low stock alert: ${productName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Running low on stock ⚠️</h2>
          <p>Hi ${sellerBusinessName}, <strong>${productName}</strong> has only <strong>${stockLeft}</strong> left in stock.</p>
          <p>Restock soon to avoid missing out on sales.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/products"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Update Stock
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Low stock email error:", err.message);
  }
};

const sendInactivityWarningEmail = async (sellerEmail, sellerBusinessName) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Your MoonStore is about to be deactivated",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Your store has been quiet 👀</h2>
          <p>Hi ${sellerBusinessName}, your store hasn't made a sale in a while. If nothing changes in the next 3 days, your store will be automatically deactivated.</p>
          <p>Make a sale, or reach out to support if you need help getting things moving again.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Go to Dashboard
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Inactivity warning email error:", err.message);
  }
};

const sendStoreDeactivatedEmail = async (sellerEmail, sellerBusinessName) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Your MoonStore has been deactivated",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Your store has been deactivated</h2>
          <p>Hi ${sellerBusinessName}, your store has been deactivated due to 30 days of inactivity.</p>
          <p>If you'd like to reactivate your store, please contact support.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Store deactivated email error:", err.message);
  }
};

const sendAdminDeactivationSummaryEmail = async (deactivatedSellers) => {
  try {
    const listHtml = deactivatedSellers
      .map((s) => `<li>${s.businessName} (${s.email})</li>`)
      .join("");

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: process.env.ADMIN_EMAIL,
      subject: `${deactivatedSellers.length} store(s) auto-deactivated today`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Auto-deactivation summary</h2>
          <p>The following stores were automatically deactivated due to 30 days of inactivity:</p>
          <ul>${listHtml}</ul>
          <p>They will be permanently deleted in 7 days if not reactivated.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin deactivation summary email error:", err.message);
  }
};

const sendStoreDeletedEmail = async (sellerEmail, sellerBusinessName) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "Your MoonStore has been permanently deleted",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Your store has been deleted</h2>
          <p>Hi ${sellerBusinessName}, your store was permanently deleted after 30 days of inactivity followed by a 7-day grace period with no response.</p>
          <p>If you believe this was a mistake, please contact support.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Store deleted email error:", err.message);
  }
};

const sendAdminDeletionSummaryEmail = async (deletedSellers) => {
  try {
    const listHtml = deletedSellers
      .map((s) => `<li>${s.businessName} (${s.email})</li>`)
      .join("");

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: process.env.ADMIN_EMAIL,
      subject: `${deletedSellers.length} store(s) permanently deleted today`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Auto-deletion summary</h2>
          <p>The following stores were permanently deleted after 30 days inactive + 7 days grace period:</p>
          <ul>${listHtml}</ul>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin deletion summary email error:", err.message);
  }
};

const sendAdminNewDisputeEmail = async (conversationId, sellerBusinessName, reason, raisedBy) => {
  try {
    const disputeLink = `${process.env.FRONTEND_URL}/admin/disputes/${conversationId}`;
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: process.env.ADMIN_EMAIL,
      subject: `New dispute raised — ${sellerBusinessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">A dispute needs review ⚠️</h2>
          <p>Raised by the <strong>${raisedBy}</strong> on an order from <strong>${sellerBusinessName}</strong>.</p>
          <p>Reason: ${reason}</p>
          <a href="${disputeLink}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Review Dispute
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin new dispute email error:", err.message);
  }
};

const sendDisputeNotificationEmail = async (toEmail, recipientName, chatLink, deadline) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: toEmail,
      subject: "MoonStore support needs you in your order chat",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Action needed on a disputed order</h2>
          <p>Hi ${recipientName}, MoonStore support is reviewing a dispute on your order and needs your input.</p>
          <p>Please respond in the chat before <strong>${deadline.toLocaleString("en-NG")}</strong>. If we don't hear from either side by then, a decision will be made automatically.</p>
          <a href="${chatLink}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Go to Chat
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Dispute notification email error:", err.message);
  }
};

module.exports = { sendSellerNewChatEmail, sendBuyerReplyEmail, sendPasswordResetEmail, sendSignupConfirmationEmail, sendLowStockEmail, sendInactivityWarningEmail, sendStoreDeactivatedEmail, sendAdminDeactivationSummaryEmail, sendAdminDeletionSummaryEmail, sendStoreDeletedEmail,sendAdminNewDisputeEmail, sendDisputeNotificationEmail };