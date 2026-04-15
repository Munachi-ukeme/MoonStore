const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"; //backend address

const getAuthHeaders = () =>{
    const token = localStorage.getItem("token");
    return{
        "Content-Type": "application/json",
        ...(token && {Authorization: `Bearer ${token}`}),
    };
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

//SELLER ACCOUNT
//Permently delete the seller's account
export const deleteSellerAccount = async () =>{
    const res = await fetch(`${BASE_URL}/seller/account`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    return res.json();
};