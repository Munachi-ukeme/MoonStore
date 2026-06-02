const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"; //backend address

const getAuthHeaders = () =>{
    const token = localStorage.getItem("token");
    return{
        "Content-Type": "application/json",
        ...(token && {Authorization: `Bearer ${token}`}),
    };
};

//seller signup 
export const registerSeller = async(data) =>{
    try{
        const res = await fetch(`${BASE_URL}/auth/register`, {
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
        const res = await fetch(`${BASE_URL}/payments/banks`);
        const json = await res.json();
        if (!res.ok) return { error: json.message || "Could not load banks" };
        return json;
    } catch (err) {
        return { error: "Could not load banks. Please try again." };
    }
};


export const verifyAccount = async (accountNumber, bankCode) => {
    try {
        const res = await fetch(`${BASE_URL}/payments/verify-account`, {
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
//AUTH
//Called on the login page
//send email + password, expect back {token, seller}
export const loginSeller = async(email, password) =>{
    const res = await fetch(`${BASE_URL}/auth/login`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password}),
        });
        return res.json();
};


// PUBLIC (BUYER)
// Loads the full store for a given slug - used on StorePage
export const getStore = async (slug) => {
    const res = await fetch(`${BASE_URL}/store/${slug}`);
    return res.json();
};

//Loads the full store for a given slug - used on StorePage
export const getProduct = async(slug, productSlug) => {
    const res = await fetch(`${BASE_URL}/store/${slug}/${productSlug}`);
    return res.json();
};

// PRODUCTS (Protected)
//Get all products belonging to the logged-in seller
export const getProducts = async() =>{
    const res = await fetch(`${BASE_URL}/products`, {
        headers: getAuthHeaders(),
    });
    return res.json();
};

// Creates a new product
// Uses FormData (not JSON) because the request includes image files
// IMPORTANT: Do NOT set Content-Type manually when using FormData.
// The browser sets it automatically with the correct format for file uploads.
export const createProduct = async (formData) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: {
            ...(token && { Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
};


//Updates an existing product by ID
export const updateProduct = async(id, formData) =>{
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: {
            ...(token && { Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
};

//Delete a product by ID
export const deleteProduct = async (id) =>{
    const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
};

//CATEGORIES (Protected)
export const getCategories = async () =>{
    const res = await fetch(`${BASE_URL}/categories`, {
        headers: getAuthHeaders(),
    });
    return res.json();
};

export const createCategory = async(name) =>{
    const res = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({name}),
    });
    return res.json();
};

export const updateCategory = async (id, name) =>{
    try{
        const res = await fetch(`${BASE_URL}/categories/${id}`, {
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
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
};

// STORE SETTINGS (Protected)

//Updates store settings - uses FormData bacause logo/banner are image uploads
export const updateStoreSettings = async(formData) =>{
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/store/settings`, {
        method: "PUT",
        headers: {
            ...(token && {Authorization: `Bearer ${token}`}),
        },
        body: formData,
    });
    return res.json();
};

export const changeSellerPassword = async (currentPassword, newPassword) => {
    try {
        const res = await fetch(`${BASE_URL}/seller/change-password`, {
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
    const res = await fetch(`${BASE_URL}/seller/account`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
};