import {BrowserRouter, Routes, Route} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./sellerComponent/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";

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
          <DashboardLayout>
            <DashboardPage/>
          </DashboardLayout>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/products" element={
        <ProtectedRoute>
          <DashboardLayout>
            <div>products</div>
          </DashboardLayout>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/categories" element={
        <ProtectedRoute>
          <DashboardLayout>
            <div>Categories</div>
          </DashboardLayout>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
        
        }/>

    </Routes>
    </BrowserRouter>
    </AuthProvider>
    
  );
}

export default App;