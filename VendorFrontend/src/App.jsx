import {BrowserRouter, Routes, Route} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./pages/LoginPage";

function App(){
  return (
    <AuthProvider>
    <BrowserRouter>
    <Routes>

      {/* Launch routes */}
      <Route path="/" element={<LoginPage />}/>

      {/* Public buyer routes */}
      <Route path="/:slug" element={<div>Store Page</div>}/>
      <Route path="/:slug/:productSlug" element={<div>Product Page</div>}/>

      {/* Auth */}
      <Route path="/login" element={<LoginPage/>}/>

      {/* Protected seller routes - wrapped in protectedRoute*/}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div>Dashboard</div>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/products" element={
        <ProtectedRoute>
          <div>Products</div>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/categories" element={
        <ProtectedRoute>
          <div>Categories</div>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/settings" element={
        <ProtectedRoute>
          <div>Settings</div>
        </ProtectedRoute>
        
        }/>

    </Routes>
    </BrowserRouter>
    </AuthProvider>
    
  );
}

export default App;