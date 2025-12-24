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
                  {/* Auth route */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Onboarding routes */}
                  <Route path="/onboarding" element={<OnboardingWelcome />} />
                  <Route path="/onboarding/profile" element={<OnboardingProfile />} />
                  <Route path="/onboarding/address" element={<OnboardingAddress />} />
                  <Route path="/onboarding/complete" element={<OnboardingComplete />} />
                  
                  {/* Main app routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/order/:orderId" element={<OrderStatus />} />
                  <Route path="/profile/settings" element={<ProfileSettings />} />
                  
                  {/* Delivery routes */}
                  <Route path="/delivery" element={<DeliveryHome />} />
                  <Route path="/delivery/orders" element={<DeliveryOrders />} />
                  <Route path="/delivery/profile" element={<DeliveryProfile />} />

                  {/* Admin routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
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
