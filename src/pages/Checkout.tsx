import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  Clock,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const addresses = [
  { id: '1', label: 'Home', address: '123, Green Park, New Delhi - 110016', isDefault: true },
  { id: '2', label: 'Office', address: '456, Cyber City, Gurugram - 122001', isDefault: false },
];

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Wallet, description: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, description: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: Clock, description: 'Pay when delivered' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, deliveryFee, clearCart, updateQuantity } = useCart();
  const { toast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const grandTotal = totalPrice + deliveryFee - discount;

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

  const placeOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      clearCart();
      toast({
        title: '🎉 Order placed successfully!',
        description: 'Your order will be delivered in 10-15 minutes',
      });
      navigate('/orders');
    }, 1500);
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
    <div className="min-h-screen bg-background pb-32">
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
        {/* Delivery Address */}
        <Card className="p-4 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Delivery Address</h2>
          </div>
          <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  selectedAddress === addr.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
                onClick={() => setSelectedAddress(addr.id)}
              >
                <RadioGroupItem value={addr.id} id={addr.id} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={addr.id} className="font-medium text-foreground cursor-pointer">
                    {addr.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{addr.address}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          <Button variant="outline" size="sm" className="mt-3 w-full">
            + Add New Address
          </Button>
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
        <Card className="p-4 border border-border rounded-xl">
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
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? 'Placing Order...' : `Pay ₹${grandTotal}`}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
