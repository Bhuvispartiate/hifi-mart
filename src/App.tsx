import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { DeliveryAuthProvider } from "@/contexts/DeliveryAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import DeliveryProtectedRoute from "@/components/delivery/DeliveryProtectedRoute";
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
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
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
import AdminOrderRequests from "./pages/admin/AdminOrderRequests";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners";
import AdminHomeDelivery from "./pages/admin/AdminHomeDelivery";
import AdminLiveTracking from "./pages/admin/AdminLiveTracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <DeliveryAuthProvider>
            <LocationProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Auth route - Customer login */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Onboarding routes - Protected for customers */}
                    <Route path="/onboarding" element={
                      <ProtectedRoute requireOnboarding={false}>
                        <OnboardingWelcome />
                      </ProtectedRoute>
                    } />
                    <Route path="/onboarding/profile" element={
                      <ProtectedRoute requireOnboarding={false}>
                        <OnboardingProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/onboarding/address" element={
                      <ProtectedRoute requireOnboarding={false}>
                        <OnboardingAddress />
                      </ProtectedRoute>
                    } />
                    <Route path="/onboarding/complete" element={
                      <ProtectedRoute requireOnboarding={false}>
                        <OnboardingComplete />
                      </ProtectedRoute>
                    } />
                    
                    {/* Main app routes - Protected for customers */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    } />
                    <Route path="/categories" element={
                      <ProtectedRoute>
                        <Categories />
                      </ProtectedRoute>
                    } />
                    <Route path="/offers" element={
                      <ProtectedRoute>
                        <Offers />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/product/:id" element={
                      <ProtectedRoute>
                        <ProductDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/order/:orderId" element={
                      <ProtectedRoute>
                        <OrderStatus />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile/settings" element={
                      <ProtectedRoute>
                        <ProfileSettings />
                      </ProtectedRoute>
                    } />
                    
                    {/* Delivery routes - Protected for delivery partners */}
                    <Route path="/delivery/login" element={<DeliveryLogin />} />
                    <Route path="/delivery" element={
                      <DeliveryProtectedRoute>
                        <DeliveryHome />
                      </DeliveryProtectedRoute>
                    } />
                    <Route path="/delivery/orders" element={
                      <DeliveryProtectedRoute>
                        <DeliveryOrders />
                      </DeliveryProtectedRoute>
                    } />
                    <Route path="/delivery/profile" element={
                      <DeliveryProtectedRoute>
                        <DeliveryProfile />
                      </DeliveryProtectedRoute>
                    } />

                    {/* Admin routes - Protected for admin */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="order-requests" element={<AdminOrderRequests />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
                      <Route path="home-delivery" element={<AdminHomeDelivery />} />
                      <Route path="live-tracking" element={<AdminLiveTracking />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CartProvider>
            </LocationProvider>
          </DeliveryAuthProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
