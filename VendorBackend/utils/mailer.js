const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// anything a user can type must be escaped before it goes into an email's HTML
const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const sendSellerNewChatEmail = async (sellerEmail, sellerBusinessName, productNames) => {
  try {
    let productListHtml;
    if (Array.isArray(productNames) && productNames.length > 1) {
      const items = productNames
        .map((name) => `<li>${escapeHtml(name)}</li>`)
        .join("");
      productListHtml = `<p>A buyer is interested in these products:</p><ul style="padding-left:20px;">${items}</ul>`;
    } else {
      const singleName = Array.isArray(productNames) ? productNames[0] : productNames;
      productListHtml = `<p>A buyer is interested in <strong>${escapeHtml(singleName)}</strong>.</p>`;
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
    const restoreLink = `${process.env.FRONTEND_URL}/restore?sid=${encodeURIComponent(sessionId)}&store=${encodeURIComponent(storeSlug)}`;
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: `${sellerBusinessName} replied to your order`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">You have a reply 💬</h2>
          <p><strong>${escapeHtml(sellerBusinessName)}</strong> has responded to your order.</p>
          <a href="${restoreLink}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            View Reply
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MoonStore — Your Store. Your Rules.</p>
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
          <p>Hi ${escapeHtml(sellerBusinessName)}, click below to set a new password. This link expires in 5 minutes.</p>
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
          <p>Hi ${escapeHtml(businessName)}, click below to confirm your email and continue setting up your store. This link expires in 30 minutes.</p>
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
          <p>Hi ${escapeHtml(sellerBusinessName)}, <strong>${escapeHtml(productName)}</strong> has only <strong>${escapeHtml(stockLeft)}</strong> left in stock.</p>
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
          <p>Hi ${escapeHtml(sellerBusinessName)}, your store hasn't made a sale in a while. If nothing changes in the next 3 days, your store will be automatically deactivated.</p>
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
          <p>Hi ${escapeHtml(sellerBusinessName)}, your store has been deactivated due to 30 days of inactivity.</p>
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
      .map((s) => `<li>${escapeHtml(s.businessName)} (${escapeHtml(s.email)})</li>`)
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
          <p>Hi ${escapeHtml(sellerBusinessName)}, your store was permanently deleted after 30 days of inactivity followed by a 7-day grace period with no response.</p>
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
      .map((s) => `<li>${escapeHtml(s.businessName)} (${escapeHtml(s.email)})</li>`)
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
          <p>Raised by the <strong>${escapeHtml(raisedBy)}</strong> on an order from <strong>${escapeHtml(sellerBusinessName)}</strong>.</p>
          <p>Reason: ${escapeHtml(reason)}</p>
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
          <p>Hi ${escapeHtml(recipientName)}, MoonStore support is reviewing a dispute on your order and needs your input.</p>
                    <p>Please reply in the chat before <strong>${escapeHtml(deadline.toLocaleString("en-NG"))}</strong> so our team has everything it needs to review the order.</p>
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

const sendAdminAlertEmail = async (subject, message) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: process.env.ADMIN_EMAIL,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">${escapeHtml(subject)}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Admin alert email error:", err.message);
  }
};

const sendBuyerLoginLinkEmail = async (buyerEmail, token, purpose, storeName) => {
  try {
    const link = `${process.env.FRONTEND_URL}/buyer/confirm/${token}`;
    const isConfirm = purpose === "confirm";

    const subject = isConfirm
      ? "Confirm it's you to continue your MoonStore order"
      : "Your MoonStore login link";

    const intro = isConfirm
      ? `Someone is placing an order at <strong>${escapeHtml(storeName || "a MoonStore store")}</strong> using this email address. Only continue if that was you.`
      : "Click below to log in and see your MoonStore orders.";

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">${isConfirm ? "Confirm it's you" : "Log in to MoonStore"}</h2>
          <p>${intro}</p>
          <p>This link works once and expires in 20 minutes.</p>
          <a href="${link}"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            ${isConfirm ? "Yes, continue my order" : "Log in"}
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If this wasn't you, ignore this email. Nothing will happen.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer login link email error:", err.message);
  }
};


const sendBuyerShippedEmail = async (buyerEmail, storeName, riderName, riderPhone) => {
  try {
    const riderLine = riderName
      ? `${escapeHtml(riderName)}, <strong>+${escapeHtml(riderPhone)}</strong>`
      : `<strong>+${escapeHtml(riderPhone)}</strong>`;

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: `${storeName} has shipped your order`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Your order is on its way 📦</h2>
          <p><strong>${escapeHtml(storeName)}</strong> has handed your order to a delivery person.</p>
          <p>Delivery person: ${riderLine}</p>
          <p><strong>When your parcel arrives:</strong></p>
          <ol>
  <li>Open your order chat and find your parcel code.</li>
  <li>Check the same code is written on your parcel.</li>
  <li>Type the code to confirm delivery. Do this only when you are holding the parcel.</li>
</ol>
          <p>Phone not with you when the rider arrives? Open moonstore.ng on any phone, login with your email, and use the link we send you to open your order.</p>
          <p>If this order was not really shipped, open your chat and raise a dispute.</p>
          <a href="${process.env.FRONTEND_URL}/my-orders"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Open My Orders
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer shipped email error:", err.message);
  }
};

const sendBuyerReleaseReminderEmail = async (buyerEmail, storeName, isDelivered) => {
  try {
    const line = isDelivered
      ? "Your window to raise a problem with this order closes in about 24 hours."
      : "The seller will be paid automatically in about 24 hours.";

    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: `Reminder about your order from ${storeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">A quick reminder ⏰</h2>
          <p>${line}</p>
          <p>If you have not received your order, or something is wrong, open your order chat and raise a dispute now. After the seller is paid, a dispute is no longer possible.</p>
          <a href="${process.env.FRONTEND_URL}/my-orders"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Open My Orders
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer release reminder email error:", err.message);
  }
};

const sendBuyerOrderCancelledEmail = async (buyerEmail, storeName, reasonText) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: `${storeName} cancelled your order`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Your order was cancelled</h2>
          <p><strong>${escapeHtml(storeName)}</strong> cancelled your order. Reason: ${escapeHtml(reasonText)}.</p>
          <p>Your payment is being refunded. The escrow service fee cannot be returned.</p>
          <a href="${process.env.FRONTEND_URL}/my-orders"
            style="display:inline-block;padding:10px 20px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Open My Orders
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer order cancelled email error:", err.message);
  }
};

const sendBuyerDisputeWarningEmail = async (buyerEmail) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: "A warning about disputes on your MoonStore account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Please read this</h2>
          <p>Two disputes you raised were decided in the seller's favour. If a third is decided the same way, we will stop new orders from your email for 90 days.</p>
          <p>Please only raise a dispute when there is a real problem with an order.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer dispute warning email error:", err.message);
  }
};

const sendBuyerBlockedEmail = async (buyerEmail, untilDate) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: buyerEmail,
      subject: "New orders are paused on your MoonStore account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">New orders are paused</h2>
          <p>Three disputes you raised were decided in the seller's favour, so new orders from your email are paused until <strong>${escapeHtml(untilDate.toLocaleDateString("en-NG"))}</strong>.</p>
          <p>Orders you already paid for are not affected. If you think this is a mistake, contact MoonStore support on WhatsApp 09126664419.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Buyer blocked email error:", err.message);
  }
};

const sendSellerDisputeWarningEmail = async (sellerEmail, businessName) => {
  try {
    await resend.emails.send({
      from: "MoonStore <noreply@moonstore.ng>",
      to: sellerEmail,
      subject: "A warning about disputes on your MoonStore store",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #6d28d9;">Please read this</h2>
          <p>Hi ${escapeHtml(businessName)}, three disputes on your store have been decided in the buyer's favour. If another is decided the same way, your store may be suspended after review.</p>
          <p>Please check items, packaging and delivery details before you ship, and keep proof of dispatch.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Seller dispute warning email error:", err.message);
  }
};

module.exports = {
  sendSellerNewChatEmail,
  sendBuyerReplyEmail,
  sendPasswordResetEmail,
  sendSignupConfirmationEmail,
  sendLowStockEmail,
  sendInactivityWarningEmail,
  sendStoreDeactivatedEmail,
  sendAdminDeactivationSummaryEmail,
  sendStoreDeletedEmail,
  sendAdminDeletionSummaryEmail,
  sendAdminNewDisputeEmail,
  sendDisputeNotificationEmail,
  sendAdminAlertEmail,
  sendBuyerLoginLinkEmail,
  sendBuyerShippedEmail,
  sendBuyerReleaseReminderEmail,
  sendBuyerOrderCancelledEmail,
  sendBuyerDisputeWarningEmail,
  sendSellerDisputeWarningEmail,
  sendBuyerBlockedEmail,
};