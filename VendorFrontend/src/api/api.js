export const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const fetchWithTimeout = async (url, options = {}, timeout = 20000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw err;
  }
};

// Helper Headers
const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  } catch (error) {
    return { "Content-Type": "application/json" };
  }
};

const getAdminHeaders = () => {
  try {
    const adminToken = localStorage.getItem("moonstore_admin_token");
    return {
      "Content-Type": "application/json",
      ...(adminToken && { "admin-key": adminToken }),
    };
  } catch (error) {
    return { "Content-Type": "application/json" };
  }
};

// ================= AUTH =================
export const registerSeller = async (data) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || json.error || "Registration failed" };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong. Please try again." };
  }
};

export const loginSeller = async (email, password) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || json.error || "Login failed" };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong." };
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not send reset link." };
    return json;
  } catch (err) {
    return { error: err.message || "Could not send reset link. Please try again." };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not reset password." };
    return json;
  } catch (err) {
    return { error: err.message || "Could not reset password. Please try again." };
  }
};

// ================= PAYMENTS =================
export const getBanks = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/payments/banks`);
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load banks" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load banks. Please try again." };
  }
};

export const verifyAccount = async (accountNumber, bankCode) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/payments/verify-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Account not found" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not verify account. Please try again." };
  }
};

export const initializePayment = async (plan) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/payments/initialize`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Payment initialization failed" };
    return json;
  } catch (err) {
    return { error: err.message || "Payment initialization failed" };
  }
};

export const generatePaymentLink = async (conversationId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/generate-payment-link`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to generate payment link" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to generate payment link" };
  }
};

// ================= PUBLIC (BUYER & STORE) =================
export const getStore = async (slug) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/store/${slug}`);
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Store not found", status: res.status };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong." };
  }
};

export const getProduct = async (slug, productSlug) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/store/${slug}/${productSlug}`);
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Product not found" };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong." };
  }
};

export const saveBuyerEmail = async (email, sessionId, sellerId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/buyer/save-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sessionId, sellerId }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not save email" };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong. Please try again." };
  }
};

export const buyerLogin = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/buyer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || json.message || "Login failed" };
    return json;
  } catch (err) {
    return { error: err.message || "Something went wrong. Please try again." };
  }
};

export const getBuyerConversations = async (sessionIds) => {
  try {
    const query = Array.isArray(sessionIds) ? sessionIds.join(",") : sessionIds;
    const res = await fetchWithTimeout(`${BASE_URL}/buyer/conversations?sessionIds=${query}`);
    const json = await res.json();
    if (!res.ok) return { error: json.error || json.message || "Could not load orders" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load orders. Please try again." };
  }
};

export const getSellerConversations = async (slug, sessionId) => {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/buyer/conversations/seller/${slug}?sessionId=${sessionId}`
    );
    const json = await res.json();
    if (!res.ok) return { error: json.error || json.message || "Could not load orders" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load orders. Please try again." };
  }
};

// ================= CHAT =================
export const startConversation = async (
  slug,
  sessionId,
  items,
  buyerName,
  buyerEmail,
  deliveryAddress,
  deliveryCity,
  deliveryPhone
) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        sessionId,
        items,
        buyerName,
        buyerEmail,
        deliveryAddress,
        deliveryCity,
        deliveryPhone,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to start conversation" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to start conversation" };
  }
};

export const sendBuyerMessage = async (conversationId, sessionId, content) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sessionId },
      body: JSON.stringify({
        content,
        sender: "buyer",
        sessionId,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to send message" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to send message" };
  }
};

export const getConversationMessages = async (conversationId, sessionId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}`, {
      headers: { "x-session-id": sessionId },
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to load messages" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to load messages" };
  }
};

export const sendImageMessage = async (conversationId, sessionId, base64Content, sender) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: base64Content,
        sender,
        sessionId,
      }),
    });
    if (res.status === 413) return { status: 413, error: "Image size too large" };
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to send image" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to send image" };
  }
};

export const reportConversation = async (conversationId, sessionId, reason, buyerPhone) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sessionId },
      body: JSON.stringify({ reason, buyerPhone }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to submit report" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to submit report" };
  }
};

export const getSellerInbox = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/seller/inbox`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to load inbox" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to load inbox" };
  }
};

export const getSellerChatMessages = async (conversationId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/seller/messages/${conversationId}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to load messages" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to load messages" };
  }
};

export const sendSellerMessage = async (conversationId, content) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/message`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
        sender: "seller",
      }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to send message" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to send message" };
  }
};

// ================= PRODUCTS (Protected) =================
export const getProducts = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to fetch products." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to fetch products." };
  }
};

export const createProduct = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/products`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to create product." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to create product." };
  }
};

export const updateProduct = async (id, formData) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to update product." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to update product." };
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to delete product." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to delete product." };
  }
};

// ================= CATEGORIES (Protected) =================
export const getCategories = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/categories`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to fetch categories." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to fetch category." };
  }
};

export const createCategory = async (name) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || "Failed to create category." };
    return data;
  } catch (err) {
    return { error: err.message || "Failed to create category." };
  }
};

export const updateCategory = async (id, name) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to update category." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to update category." };
  }
};

export const deleteCategory = async (id) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to delete category." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to delete category." };
  }
};

// ================= STORE & SELLER ACCOUNT =================
export const updateStoreSettings = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/store/settings`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to update store settings." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to update store settings." };
  }
};

export const changeSellerPassword = async (currentPassword, newPassword) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/seller/change-password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to change password." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to change password." };
  }
};

export const deleteSellerAccount = async (reason) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/seller/account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to delete seller account." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to delete seller account." };
  }
};

// ================= ANALYTICS =================
export const trackStoreVisit = async ({ sellerId, sessionId, referrer }) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/store-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, sessionId, referrer }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to track store visit" };
  }
};

export const trackProductClick = async ({ sellerId, productId, sessionId }) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/product-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, productId, sessionId }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to track product click" };
  }
};

export const getAnalyticsSummary = async (period) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/summary?period=${period}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to fetch analytics" };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to fetch analytics" };
  }
};

// ================= REVIEWS =================
export const getReviewEligibility = async (productId, buyerEmail) => {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/reviews/eligibility?productId=${productId}&buyerEmail=${encodeURIComponent(buyerEmail)}`
    );
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to check review eligibility." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to check review eligibility." };
  }
};

export const submitReview = async (sellerId, productId, buyerEmail, rating, text) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, productId, buyerEmail, rating, text }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to submit review." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to submit review." };
  }
};

export const getProductReviews = async (productId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/reviews/product/${productId}`);
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to load reviews." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to load reviews." };
  }
};

// ================= ADMIN =================
export const adminLogin = async (passkey) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Login failed" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not log in. Please try again." };
  }
};

export const getReportedConversationsAdmin = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/reports`, {
      headers: getAdminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load reports" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load reports. Please try again." };
  }
};

export const getAllSellers = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/sellers`, {
      headers: getAdminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load sellers" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load sellers. Please try again." };
  }
};

export const activateStore = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/activate`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not activate store" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not activate store. Please try again." };
  }
};

export const deactivateStore = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/deactivate`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not deactivate store" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not deactivate store. Please try again." };
  }
};

export const deleteSellerAdmin = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/delete-seller`, {
      method: "DELETE",
      headers: getAdminHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not delete seller" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not delete seller. Please try again." };
  }
};

export const getAllReferralsAdmin = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/referrals`, {
      headers: getAdminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load referrals" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load referrals. Please try again." };
  }
};

export const markCommissionPaidAdmin = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/mark-commission-paid`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not update commission" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not update commission. Please try again." };
  }
};

export const adminLogout = async () => {
  try {
    await fetchWithTimeout(`${BASE_URL}/admin/logout`, {
      method: "POST",
      headers: getAdminHeaders(),
    });
  } catch (err) {
    // Fail silently on logout request
  }
};

export const getRevenueSummaryAdmin = async (startDate, endDate) => {
  try {
    let url = `${BASE_URL}/admin/revenue-summary`;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetchWithTimeout(url, { headers: getAdminHeaders() });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load revenue" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load revenue. Please try again." };
  }
};

export const getExitSurveys = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/exit-surveys`, {
      method: "GET",
      headers: getAdminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Failed to fetch exit surveys." };
    return json;
  } catch (err) {
    return { error: err.message || "Failed to fetch exit surveys." };
  }
};

export const getUnverifiedSellersAdmin = async () => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/unverified-sellers`, {
      headers: getAdminHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not load unverified sellers" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not load unverified sellers. Please try again." };
  }
};

export const verifySubaccountAdmin = async (email) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/admin/verify-subaccount`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not verify subaccount" };
    return json;
  } catch (err) {
    return { error: err.message || "Could not verify subaccount. Please try again." };
  }
};


export const requestSignupConfirmation = async (payload) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/request-signup-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || "Could not send confirmation email." };
    return json;
  } catch (err) {
    return { error: err.message || "Could not send confirmation email." };
  }
};

export const verifySignupToken = async (token) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/verify-signup-token?token=${encodeURIComponent(token)}`);
    const json = await res.json();
    if (!res.ok) return { error: json.message || "This link is invalid or has expired." };
    return json;
  } catch (err) {
    return { error: err.message || "Could not verify this link." };
  }
};