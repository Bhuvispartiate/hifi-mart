import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
