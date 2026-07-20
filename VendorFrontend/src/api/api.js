const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"; //backend address

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

const getAuthHeaders = () =>{
  try{
    const token = localStorage.getItem("token");
    return{
        "Content-Type": "application/json",
        ...(token && {Authorization: `Bearer ${token}`}),
    };
   } catch (error){
        return{ error: "Failed to fetch token"};
    }
};

//seller signup 
export const registerSeller = async(data) =>{
    try{
        const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) return { error: json.message || "Registration failed" };
        return json;
    } catch (err) {
        return { error: "Something went wrong. Please try again." };
    }
};

// payment
export const getBanks = async() =>{
    try{
        const res = await fetchWithTimeout(`${BASE_URL}/payments/banks`);
        const json = await res.json();
        if (!res.ok) return { error: json.message || "Could not load banks" };
        return json;
    } catch (err) {
        return { error: "Could not load banks. Please try again." };
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
        return { error: "Could not verify account. Please try again." };
    }
};

export const initializePayment = async (plan) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
    return await res.json();
  } catch {
    return { error: "Payment initialization failed" };
  }
};
//AUTH
//Called on the login page
//send email + password, expect back {token, seller}
export const loginSeller = async(email, password) =>{
    try{
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password}),
        });
        return res.json();
    }catch (err) {
    return { error: err.error || "Something went wrong." };
  }
};


// PUBLIC (BUYER)
// Loads the full store for a given slug - used on StorePage
export const getStore = async (slug) => {
    try{
    const res = await fetchWithTimeout(`${BASE_URL}/store/${slug}`);
    return res.json();
    } catch (err) {
    return { error: err.error || "Something went wrong." };
  }
};

//Loads the full store for a given slug - used on StorePage
export const getProduct = async(slug, productSlug) => {
    try{
    const res = await fetchWithTimeout(`${BASE_URL}/store/${slug}/${productSlug}`);
    return res.json();
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
        return { error: "Something went wrong. Please try again." };
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
        if (!res.ok) return { error: json.error || "Login failed" };
        return json;
    } catch (err) {
        return { error: "Something went wrong. Please try again." };
    }
};

//Buyer side
// this is for all chats across moonstore stores
export const getBuyerConversations = async (sessionIds) => {
    try {
        // sessionIds is an array — we join to a comma-separated query string
        const query = sessionIds.join(",");
        const res = await fetchWithTimeout(`${BASE_URL}/buyer/conversations?sessionIds=${query}`);
        const json = await res.json();
        if (!res.ok) return { error: json.error || "Could not load orders" };
        return json;
    } catch (err) {
        return { error: "Could not load orders. Please try again." };
    }
};

//this is for chat in a specific store
export const getSellerConversations = async (slug, sessionId) => {
    try {
        const res = await fetchWithTimeout(
            `${BASE_URL}/buyer/conversations/seller/${slug}?sessionId=${sessionId}`
        );
        const json = await res.json();
        if (!res.ok) return { error: json.error || "Could not load orders" };
        return json;
    } catch (err) {
        return { error: "Could not load orders. Please try again." };
    }
};

export const buyerClaimedPayment = async (conversationId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/buyer-paid`, {
      method: "PUT",
    });
    return await res.json();
  } catch {
    return { error: "Failed to send claim" };
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
        sessionId: sessionId 
       }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to send message" };
  }
};

export const getConversationMessages = async (conversationId, sessionId) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}`, {
      headers: { "x-session-id": sessionId },
    });
    return await res.json();
  } catch {
    return { error: "Failed to load messages" };
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
    if (res.status === 413) return { status: 413 };
    return await res.json();
  } catch {
    return { error: "Failed to send image" };
  }
};

export const reportConversation = async (conversationId, sessionId, reason) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sessionId },
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to submit report" };
  }
};




export const startConversation = async (slug, sessionId, items, buyerName, buyerEmail, deliveryAddress, deliveryCity, deliveryPhone) => {
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
        return await res.json();
    } catch {
        return { error: "Failed to start conversation" };
    }
};

//forgotten password
export const forgotPassword = async (email) => {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return await res.json();
    } catch {
        return { error: "Could not send reset link. Please try again." };
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword }),
        });
        return await res.json();
    } catch {
        return { error: "Could not reset password. Please try again." };
    }
};

// SELLER SIDE
export const getSellerInbox = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/chat/seller/inbox`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { error: "Failed to load inbox" };
  }
};

export const getSellerChatMessages = async (conversationId) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/chat/seller/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { error: "Failed to load messages" };
  }
};

export const sendSellerMessage = async (conversationId, content) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        content,
        sender: "seller",      
        
      }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to send message" };
  }
};



// PRODUCTS (Protected)
//Get all products belonging to the logged-in seller
export const getProducts = async() =>{
  try{
    const res = await fetchWithTimeout(`${BASE_URL}/products`, {
        headers: getAuthHeaders(),
    });
    return res.json();
  } catch (error){
        return{ error: "Failed to fetch products."};
    }
};

// Creates a new product
// Uses FormData (not JSON) because the request includes image files
// IMPORTANT: Do NOT set Content-Type manually when using FormData.
// The browser sets it automatically with the correct format for file uploads.
export const createProduct = async (formData) => {
  try{
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/products`, {
        method: "POST",
        headers: {
            ...(token && { Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
  }catch (error){
        return{ error: "Failed to create product."};
    }
};


//Updates an existing product by ID
export const updateProduct = async(id, formData) =>{
  try{
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: {
            ...(token && { Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
  }catch (error){
          return{ error: "Failed to update product."};
    }
};

//Delete a product by ID
export const deleteProduct = async (id) =>{
  try{
    const res = await fetchWithTimeout(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
  } catch (error){
        return{ error: "Failed to delete product."};
    }
};

//CATEGORIES (Protected)
export const getCategories = async () =>{
  try{
    const res = await fetchWithTimeout(`${BASE_URL}/categories`, {
        headers: getAuthHeaders(),
    });
    return res.json();
  }catch (error){
        return{ error: "Failed to fetch category."};
    }
};

export const createCategory = async (name) => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    // 1. Parse the JSON response first to see what the server said
    const data = await res.json();

    // 2. If the server returned an error code (like 403 or 500)
    if (!res.ok) {
      return { 
        error: data.message || "Failed to create category." 
      };
    }

    // 3. SUCCESS: Return the actual data
    return data;

  } catch (error) {
    return { error: "Failed to create category." };
  }
};


export const updateCategory = async (id, name) =>{
    try{
        const res = await fetchWithTimeout(`${BASE_URL}/categories/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name }),
        });
        return res.json();
    } catch (error){
        return{ error: "Failed to update category."};
    }
};

export const deleteCategory = async(id) =>{
  try{
    const res = await fetchWithTimeout(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
  }catch (error){
        return{ error: "Failed to delete category."};
    }
};

// STORE SETTINGS (Protected)

//Updates store settings - uses FormData bacause logo/banner are image uploads
export const updateStoreSettings = async(formData) =>{
  try{
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/store/settings`, {
        method: "PUT",
        headers: {
            ...(token && {Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
  }catch (error){
        return{ error: "Failed to update store settings."};
    }
};

export const changeSellerPassword = async (currentPassword, newPassword) => {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/seller/change-password`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return res.json();
    } catch (error) {
        return { error: "Failed to change password." };
    }
}; 


//SELLER ACCOUNT
//Permently delete the seller's account
export const deleteSellerAccount = async () =>{
  try{
    const res = await fetchWithTimeout(`${BASE_URL}/seller/account`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
  }catch (error){
        return{ error: "Failed to delete seller account."};
    }
};

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
    const token = localStorage.getItem("token");
    const res = await fetchWithTimeout(`${BASE_URL}/analytics/summary?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { error: "Failed to fetch analytics" };
  }
};

export const generatePaymentLink = async (conversationId) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetchWithTimeout(`${BASE_URL}/chat/${conversationId}/generate-payment-link`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        return await res.json();
    } catch {
        return { error: "Failed to generate payment link" };
    }
};