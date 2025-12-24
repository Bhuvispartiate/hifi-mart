import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Offers from "./pages/Offers";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import OrderStatus from "./pages/OrderStatus";
import ProfileSettings from "./pages/ProfileSettings";

import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DeliveryHome from "./pages/delivery/DeliveryHome";
import DeliveryOrders from "./pages/delivery/DeliveryOrders";
import DeliveryProfile from "./pages/delivery/DeliveryProfile";

// Onboarding pages
import OnboardingWelcome from "./pages/onboarding/OnboardingWelcome";
import OnboardingProfile from "./pages/onboarding/OnboardingProfile";
import OnboardingAddress from "./pages/onboarding/OnboardingAddress";
import OnboardingComplete from "./pages/onboarding/OnboardingComplete";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners";
import AdminHomeDelivery from "./pages/admin/AdminHomeDelivery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <LocationProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Auth route - only public route */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Onboarding routes - require auth but not onboarding completion */}
                  <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingWelcome /></ProtectedRoute>} />
                  <Route path="/onboarding/profile" element={<ProtectedRoute requireOnboarding={false}><OnboardingProfile /></ProtectedRoute>} />
                  <Route path="/onboarding/address" element={<ProtectedRoute requireOnboarding={false}><OnboardingAddress /></ProtectedRoute>} />
                  <Route path="/onboarding/complete" element={<ProtectedRoute requireOnboarding={false}><OnboardingComplete /></ProtectedRoute>} />
                  
                  {/* Protected routes - require auth and onboarding completion */}
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                  <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                  <Route path="/order/:orderId" element={<ProtectedRoute><OrderStatus /></ProtectedRoute>} />
                  <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                  
                  <Route path="/delivery" element={<ProtectedRoute><DeliveryHome /></ProtectedRoute>} />
                  <Route path="/delivery/orders" element={<ProtectedRoute><DeliveryOrders /></ProtectedRoute>} />
                  <Route path="/delivery/profile" element={<ProtectedRoute><DeliveryProfile /></ProtectedRoute>} />

                  {/* Admin routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
                    <Route path="home-delivery" element={<AdminHomeDelivery />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </LocationProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
