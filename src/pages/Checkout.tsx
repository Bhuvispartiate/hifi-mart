import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  Banknote,
  Loader2,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

import { getUserAddresses, UserAddress } from '@/lib/userProfile';
import { createOrder as createFirestoreOrder } from '@/lib/firestoreService';
import { LocationPicker } from '@/components/checkout/LocationPicker';
import { isWithinGeofence, getDistanceFromCenter, getGeofenceConfig } from '@/lib/geofencing';

const paymentMethods = [
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when delivered' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, deliveryFee, clearCart, updateQuantity } = useCart();
  const { toast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isOutsideDeliveryZone, setIsOutsideDeliveryZone] = useState(false);
  const [distanceFromCenter, setDistanceFromCenter] = useState<number | null>(null);

  const grandTotal = totalPrice + deliveryFee - discount;
  const geofenceConfig = getGeofenceConfig();

  // Check if location is within delivery zone
  useEffect(() => {
    if (pinnedLocation) {
      const withinZone = isWithinGeofence(pinnedLocation.lat, pinnedLocation.lng);
      setIsOutsideDeliveryZone(!withinZone);
      setDistanceFromCenter(getDistanceFromCenter(pinnedLocation.lat, pinnedLocation.lng));
    } else {
      setIsOutsideDeliveryZone(false);
      setDistanceFromCenter(null);
    }
  }, [pinnedLocation]);

  // Load user addresses from Firestore
  useEffect(() => {
    const loadAddresses = async () => {
      if (user) {
        setLoadingAddresses(true);
        const userAddresses = await getUserAddresses(user.uid);
        setAddresses(userAddresses);
        // Select default address or first address
        const defaultAddr = userAddresses.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        } else if (userAddresses.length > 0) {
          setSelectedAddress(userAddresses[0].id);
        }
        setLoadingAddresses(false);
      }
    };
    loadAddresses();
  }, [user]);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'FIRST50') {
      const discountAmount = Math.min(totalPrice * 0.5, 100);
      setDiscount(discountAmount);
      toast({
        title: 'Coupon applied!',
        description: `You saved ₹${discountAmount}`,
      });
    } else if (couponCode.toUpperCase() === 'SAVE75') {
      if (totalPrice >= 499) {
        setDiscount(75);
        toast({
          title: 'Coupon applied!',
          description: 'You saved ₹75',
        });
      } else {
        toast({
          title: 'Minimum order ₹499',
          description: 'Add more items to use this coupon',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Invalid coupon',
        description: 'Please check the code and try again',
        variant: 'destructive',
      });
    }
  };

  const placeOrder = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to place an order',
        variant: 'destructive',
      });
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddress);
    
    // Check if we have either a saved address or a pinned location
    if (!selectedAddr && !pinnedLocation) {
      toast({
        title: 'Select address',
        description: 'Please select a delivery address or pin a location on the map',
        variant: 'destructive',
      });
      return;
    }

    // Check geofencing - only allow orders within delivery zone
    if (pinnedLocation && isOutsideDeliveryZone) {
      toast({
        title: 'Outside delivery zone',
        description: `Sorry, we only deliver within ${geofenceConfig.radiusKm} KM of our store`,
        variant: 'destructive',
      });
      return;
    }

    // Use pinned location address if available, otherwise use saved address
    const deliveryAddress = pinnedLocation?.address || selectedAddr?.fullAddress || '';

    setIsPlacingOrder(true);
    
    try {
      // Create order in Firestore with pending status - requires admin approval
      const orderData = {
        userId: user.uid,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'pending' as const,
        total: grandTotal,
        items: items.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          productId: item.id,
        })),
        deliveryAddress: deliveryAddress,
        deliveryCoordinates: pinnedLocation ? { lat: pinnedLocation.lat, lng: pinnedLocation.lng } : undefined,
        timeline: [
          { status: 'Order Placed', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), completed: true },
          { status: 'Awaiting Confirmation', time: '', completed: false },
          { status: 'Preparing', time: '', completed: false },
          { status: 'Out for Delivery', time: '', completed: false },
          { status: 'Delivered', time: '', completed: false },
        ],
        eta: '10-15 mins',
      };

      const orderId = await createFirestoreOrder(orderData);
      
      if (orderId) {
        await clearCart();
        toast({
          title: '🎉 Order placed successfully!',
          description: 'Waiting for confirmation from the store',
        });
        navigate('/orders');
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast({
        title: 'Order failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-4 text-center">
          Add some items to proceed to checkout
        </p>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-52">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">Checkout</h1>
            <p className="text-xs text-muted-foreground">{items.length} items</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Pin Location on Map */}
        <Card className="p-4 border border-border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Pin Your Location</h2>
            </div>
          </div>
          
          {pinnedLocation ? (
            <div className="space-y-3">
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                isOutsideDeliveryZone 
                  ? "border-destructive bg-destructive/10" 
                  : "border-primary bg-primary/5"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isOutsideDeliveryZone ? "bg-destructive/20" : "bg-primary/10"
                )}>
                  {isOutsideDeliveryZone ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    isOutsideDeliveryZone ? "text-destructive" : "text-foreground"
                  )}>
                    {isOutsideDeliveryZone ? "Outside Delivery Zone" : "Pinned Location"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{pinnedLocation.address}</p>
                  {distanceFromCenter !== null && (
                    <p className={cn(
                      "text-xs mt-1",
                      isOutsideDeliveryZone ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {distanceFromCenter.toFixed(1)} KM from store
                      {isOutsideDeliveryZone && ` (max: ${geofenceConfig.radiusKm} KM)`}
                    </p>
                  )}
                </div>
              </div>
              
              {isOutsideDeliveryZone && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Sorry, we can't deliver to this location. Please select a location within {geofenceConfig.radiusKm} KM of our store.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowLocationPicker(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Change Location
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full h-20 border-dashed flex flex-col gap-1"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin className="w-6 h-6 text-primary" />
              <span className="text-sm">Tap to pin your delivery location on map</span>
            </Button>
          )}
        </Card>

        {/* Or Select Saved Address */}
        <Card className="p-4 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Or Select Saved Address</h2>
          </div>
          
          {loadingAddresses ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No addresses saved</p>
              <Link to="/profile/settings">
                <Button variant="outline" size="sm">Add Address</Button>
              </Link>
            </div>
          ) : (
            <RadioGroup 
              value={pinnedLocation ? '' : selectedAddress} 
              onValueChange={(value) => {
                setSelectedAddress(value);
                setPinnedLocation(null); // Clear pinned location when selecting saved address
              }}
            >
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    !pinnedLocation && selectedAddress === addr.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                  onClick={() => {
                    setSelectedAddress(addr.id);
                    setPinnedLocation(null);
                  }}
                >
                  <RadioGroupItem value={addr.id} id={addr.id} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={addr.id} className="font-medium text-foreground cursor-pointer">
                      {addr.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{addr.fullAddress}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
          
          <Link to="/profile/settings">
            <Button variant="outline" size="sm" className="mt-3 w-full">
              + Add New Address
            </Button>
          </Link>
        </Card>

        {/* Delivery Time */}
        <Card className="p-4 border border-border rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Delivery Time</h2>
              <p className="text-sm text-muted-foreground">Expected in 10-15 minutes</p>
            </div>
            <span className="text-2xl">🚀</span>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-4 border border-border rounded-xl">
          <h2 className="font-semibold text-foreground mb-3">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-4 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <span className="text-sm font-medium w-16 text-right">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coupon Code */}
        <Card className="p-4 border border-border rounded-xl">
          <h2 className="font-semibold text-foreground mb-3">Apply Coupon</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={applyCoupon}>
              Apply
            </Button>
          </div>
          {discount > 0 && (
            <p className="text-sm text-primary mt-2">✓ Coupon applied! You save ₹{discount}</p>
          )}
        </Card>

        {/* Payment Method */}
        <Card className="p-4 border border-border rounded-xl mb-24">
          <h2 className="font-semibold text-foreground mb-3">Payment Method</h2>
          <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  selectedPayment === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
                onClick={() => setSelectedPayment(method.id)}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor={method.id} className="font-medium text-foreground cursor-pointer">
                    {method.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </Card>
      </main>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-area-pb">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{totalPrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-primary' : ''}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Discount</span>
              <span>-₹{discount}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={placeOrder}
          disabled={isPlacingOrder || (!pinnedLocation && addresses.length === 0) || isOutsideDeliveryZone}
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : isOutsideDeliveryZone ? (
            'Outside Delivery Zone'
          ) : (
            `Pay ₹${grandTotal}`
          )}
        </Button>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={(location) => {
          setPinnedLocation(location);
          setSelectedAddress(''); // Clear saved address selection
        }}
      />
    </div>
  );
};

export default Checkout;
