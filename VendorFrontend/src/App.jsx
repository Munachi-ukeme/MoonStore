import {BrowserRouter, Routes, Route} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./sellerComponent/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService"
import StorePage from "./pages/StorePage";
import ProductPage from "./pages/ProductPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import BuyerDashboard from "./buyerComponent/BuyerDashboard";
import SessionRestore from "./pages/SessionRestore";

function App(){
  return (
    <AuthProvider>
    <BrowserRouter>
    <Routes>

      {/* Launch routes */}
      <Route path="/" element={<HomePage />} />
      

      {/* Public buyer routes */}
      <Route path="/:slug" element={<StorePage />}/>
      <Route path="/:slug/:productSlug" element={<ProductPage />}/>
      <Route path="/privacy-policy" element={<PrivacyPolicy />}/>
      <Route path="/terms-of-service" element={<TermsOfService />}/>
      <Route path="/my-orders" element={<BuyerDashboard />} />
      <Route path="/restore" element={<SessionRestore />} />


      {/* Auth */}
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/register" element={<SignupPage />}/>

      {/* Protected seller routes - wrapped in protectedRoute*/}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/products" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProductsPage/>
          </DashboardLayout>
        </ProtectedRoute>
        }/>

      <Route path="/dashboard/categories" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CategoriesPage />
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


      <Route path="/dashboard/privacypolicy" element={
        <ProtectedRoute>
          <DashboardLayout>
            <PrivacyPolicy/>
          </DashboardLayout>
        </ProtectedRoute>
        
        }/>


      <Route path="/dashboard/termsofservice" element={
        <ProtectedRoute>
          <DashboardLayout>
            <TermsOfService />
          </DashboardLayout>
        </ProtectedRoute>
        
        }/>

    </Routes>
    </BrowserRouter>
    </AuthProvider>
    
  );
}

export default App;