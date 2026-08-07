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
import BuyerOrdersPage from "./pages/BuyerOrdersPage";
import BuyerChatPage from "./pages/BuyerChatPage";
import SellerInboxPage from "./pages/SellerInboxPage";
import SellerChatThreadPage from "./pages/SellerChatThreadPage";
import OfflineBanner from "./buyerComponent/OfflineBanner";
import ErrorBoundary from "./sellerComponent/ErrorBoundary";
import AboutUsPage from "./pages/AboutUsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcceptableUsePage from "./pages/AcceptableUsePage";
import AdminLoginPage from "./adminComponent/AdminLoginPage";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminSellersPage from "./adminComponent/AdminSellersPage";
import AdminLayout from "./adminComponent/AdminLayout";
import AdminReferralsPage from "./adminComponent/AdminReferralsPage";
import AdminReportsPage from "./adminComponent/AdminReportsPage";
import AdminRevenuePage from "./adminComponent/AdminRevenuePage";
import AdminExitSurveysPage from "./adminComponent/AdminExitSurveysPage";
import AdminUnverifiedSellersPage from "./adminComponent/AdminUnverifiedSellersPage";

function App(){
  return (
    <AuthProvider>
    <OfflineBanner />
    <BrowserRouter>
    <Routes>

      {/* Launch routes */}
       <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />

      {/* Auth */}
      <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
      <Route path="/register" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
      <Route path="/forgot-password" element={<ErrorBoundary> <ForgotPasswordPage /> </ErrorBoundary>} />
<Route path="/reset-password/:token" element={<ErrorBoundary> <ResetPasswordPage /> </ErrorBoundary>} />
      

      {/* Public buyer routes */}  
      <Route path="/privacypolicy" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
      <Route path="/termsofservice" element={<ErrorBoundary><TermsOfService /></ErrorBoundary>} />
       <Route path="/my-orders" element={<ErrorBoundary><BuyerDashboard /></ErrorBoundary>} />
      <Route path="/restore" element={<ErrorBoundary><SessionRestore /></ErrorBoundary>} />
      <Route path="/aboutus" element={<ErrorBoundary><AboutUsPage /></ErrorBoundary>} />
      <Route path="/acceptableusepolicy" element={<ErrorBoundary><AcceptableUsePage /></ErrorBoundary>} />
      <Route path="/admin/login" element={<ErrorBoundary> <AdminLoginPage /></ErrorBoundary> } />
      
      <Route path="/admin/exit-surveys" element={ <ErrorBoundary> <AdminExitSurveysPage /> </ErrorBoundary>} />
      

      {/* Protected seller routes - wrapped in protectedRoute*/}
      <Route path="/dashboard" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />


<Route path="/dashboard/products" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout>
        <ProductsPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />


<Route path="/dashboard/categories" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout>
        <CategoriesPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />


<Route path="/dashboard/settings" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout>
        <SettingsPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />


<Route path="/dashboard/inbox" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout>
        <SellerInboxPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />


<Route path="/dashboard/chat/:conversationId" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <DashboardLayout hideTopbar={true}>
        <SellerChatThreadPage />
      </DashboardLayout>
    </ErrorBoundary>
  </ProtectedRoute>
} />

<Route path="/aboutus" element={
        <ProtectedRoute>
          
          <DashboardLayout>
            <AboutUsPage />
          </DashboardLayout>
          
        </ProtectedRoute>
        
        }/>

<Route path="/privacypolicy" element={
        <ProtectedRoute>
          
          <DashboardLayout>
            <PrivacyPolicy/>
          </DashboardLayout>
        
        </ProtectedRoute>
        
        }/>


      <Route path="/termsofservice" element={
        <ProtectedRoute>
          
          <DashboardLayout>
            <TermsOfService />
          </DashboardLayout>
          
        </ProtectedRoute>
        
        }/>

        <Route path="/admin/sellers" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <AdminSellersPage />
          </AdminLayout>    
        </AdminProtectedRoute>
    }/>

    <Route
    path="/admin/referrals"
    element={
        <AdminProtectedRoute>
            <AdminLayout>
                <AdminReferralsPage />
            </AdminLayout>
        </AdminProtectedRoute>
    }
/>

<Route
    path="/admin/reports"
    element={
        <AdminProtectedRoute>
            <AdminLayout>
                <AdminReportsPage />
            </AdminLayout>
        </AdminProtectedRoute>
    }
/>

<Route
    path="/admin/revenue"
    element={
        <AdminProtectedRoute>
            <AdminLayout>
                <AdminRevenuePage />
            </AdminLayout>
        </AdminProtectedRoute>
    }
/>

<Route
    path="/admin/exitsurveys"
    element={
        <AdminProtectedRoute>
            <AdminLayout>
                <AdminExitSurveysPage />
            </AdminLayout>
        </AdminProtectedRoute>
    }
/>
<Route
    path="/admin/unverifiedsellers"
    element={
        <AdminProtectedRoute>
            <AdminLayout>
                <AdminUnverifiedSellersPage />
            </AdminLayout>
        </AdminProtectedRoute>
    }
/>


      {/* buyer routes — dynamic last */}
      <Route path="/:slug/orders" element={<ErrorBoundary><BuyerOrdersPage /></ErrorBoundary>} />

      <Route path="/:slug/chat/:conversationId" element={<ErrorBoundary><BuyerChatPage /></ErrorBoundary>} />
      
      <Route path="/:slug/:productSlug" element={<ErrorBoundary><ProductPage /></ErrorBoundary>} />

      <Route path="/:slug" element={<ErrorBoundary><StorePage /></ErrorBoundary>} />

    </Routes>
    </BrowserRouter>
    </AuthProvider>
    
  );
}

export default App;