//This is like a security that insure that only logged in users can access certain parts of the app. It creates a context that holds the user's authentication status and provides functions to log in and log out. Other components can use this context to check if the user is logged in and to perform login/logout actions.

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(); // THIS create an empty container that can hold data and share it across your entire app.


//This wraps the entire app and makes auth state available everywhere
export const AuthProvider = ({ children }) =>{


   // this happen when seller login. seller holds the logged-in seller's data
  // We read from localStorage so the login survives a page refresh
  // If the page refreshes and localStorage has seller data, we restore it automatically
   const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        try {
            const stored = localStorage.getItem("seller");
            if (stored) {
                setSeller(JSON.parse(stored));
            }
        } catch (err) {
            console.error("Failed to parse seller session data:", err);
        } finally {
            setLoading(false); 
        }
    }, []);

    // Called after a successful login
  // Saves the token and seller data to localStorage AND to state
  const login = (token, sellerData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("seller", JSON.stringify(sellerData));
    setSeller(sellerData);
  };

  // Called when seller clicks logout
  // Clears everything from localStorage AND from state
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("seller");
    setSeller(null);
  };

    // updates seller data in state and localStorage without full logout
    const updateSeller = (newSellerData) =>{
      const updatedSeller = {...seller, ...newSellerData};
      localStorage.setItem("seller", JSON.stringify(updatedSeller));
      setSeller(updatedSeller);
    };


  const isAuthenticated = !!seller; 

  return(
    <AuthContext.Provider value={{ seller, isAuthenticated, login, logout, updateSeller, loading }}>
        {children}
    </AuthContext.Provider> 
  );
};

export const useAuth = () =>{
    return useContext(AuthContext); // This is how other components will access the auth context
}