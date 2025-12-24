import { useState, useEffect } from 'react';
import { 
  getProducts, 
  getUserByPhone, 
  createOfflineOrder,
  Product,
  UserProfile 
} from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Phone,
  User,
  MapPin,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LocationPicker } from '@/components/checkout/LocationPicker';
import InvoiceDialog from '@/components/admin/InvoiceDialog';
import { Order, OrderItem } from '@/lib/firestoreService';

interface CartItem {
  product: Product;
  quantity: number;
}

const AdminHomeDelivery = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customer search
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // New customer fields
  const [customerName, setCustomerName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Product search & cart
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  
  // Order creation
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const searchCustomer = async () => {
    if (phoneNumber.length < 10) {
      toast({ title: 'Enter valid phone number', variant: 'destructive' });
      return;
    }
    
    setSearchingCustomer(true);
    const found = await getUserByPhone(phoneNumber);
    
    if (found) {
      setCustomer(found);
      setIsNewCustomer(false);
      setCustomerName(found.displayName);
      if (found.addresses.length > 0) {
        setSelectedAddress(found.addresses[0].id);
      }
    } else {
      setCustomer(null);
      setIsNewCustomer(true);
      setCustomerName('');
    }
    setSearchingCustomer(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.inStock
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setNewAddress(location.address);
    setCoordinates({ lat: location.lat, lng: location.lng });
  };

  const getDeliveryAddress = () => {
    if (customer && selectedAddress) {
      const addr = customer.addresses.find(a => a.id === selectedAddress);
      return addr?.address || '';
    }
    return newAddress;
  };

  const getDeliveryCoordinates = () => {
    if (customer && selectedAddress) {
      const addr = customer.addresses.find(a => a.id === selectedAddress);
      return addr ? { lat: addr.lat, lng: addr.lng } : null;
    }
    return coordinates;
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Add products to cart', variant: 'destructive' });
      return;
    }

    const deliveryAddr = getDeliveryAddress();
    const deliveryCoords = getDeliveryCoordinates();

    if (!deliveryAddr) {
      toast({ title: 'Please select or enter delivery address', variant: 'destructive' });
      return;
    }

    if (!customerName && !customer) {
      toast({ title: 'Please enter customer name', variant: 'destructive' });
      return;
    }

    setCreatingOrder(true);

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      qty: item.quantity,
      price: item.product.price,
    }));

    const orderId = await createOfflineOrder({
      customerPhone: phoneNumber,
      customerName: customer?.displayName || customerName,
      deliveryAddress: deliveryAddr,
      deliveryCoordinates: deliveryCoords || undefined,
      items: orderItems,
      total,
      paymentMethod,
    });

    if (orderId) {
      const newOrder: Order = {
        id: orderId,
        userId: customer?.id || 'walk-in',
        date: new Date().toISOString().split('T')[0],
        status: 'confirmed',
        total,
        items: orderItems,
        deliveryAddress: deliveryAddr,
        deliveryCoordinates: deliveryCoords || undefined,
        timeline: [
          { status: 'Order Placed', time: new Date().toISOString(), completed: true },
        ],
        createdAt: new Date(),
      };
      
      setCreatedOrder(newOrder);
      setInvoiceOpen(true);
      toast({ title: 'Order created successfully!' });
      
      // Reset form
      setCart([]);
      setPhoneNumber('');
      setCustomer(null);
      setIsNewCustomer(false);
      setCustomerName('');
      setSelectedAddress('');
      setNewAddress('');
      setCoordinates(null);
    } else {
      toast({ title: 'Failed to create order', variant: 'destructive' });
    }

    setCreatingOrder(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Home Delivery</h1>
        <p className="text-muted-foreground">Create orders for walk-in customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Customer & Products */}
        <div className="space-y-6">
          {/* Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={searchCustomer} disabled={searchingCustomer}>
                  {searchingCustomer ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {customer && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{customer.displayName}</span>
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  
                  {customer.addresses.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Address</Label>
                      <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                        {customer.addresses.map((addr) => (
                          <div key={addr.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={addr.id} id={addr.id} />
                            <Label htmlFor={addr.id} className="text-sm font-normal cursor-pointer">
                              <span className="font-medium">{addr.label}</span> - {addr.address}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </div>
              )}

              {isNewCustomer && (
                <div className="space-y-4 p-4 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    New customer - enter details
                  </p>
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address *
                    </Label>
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    {newAddress && (
                      <p className="text-sm text-muted-foreground mt-2">{newAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Loading...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No products found</p>
                ) : (
                  filteredProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">₹{product.price}/{product.unit}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(product)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart & Summary */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Cart is empty. Add products to create order.
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-foreground">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="text-foreground">₹{deliveryFee}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">₹{total}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash on Delivery</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Create Order Button */}
          <Button
            className="w-full h-12 text-lg"
            disabled={cart.length === 0 || creatingOrder}
            onClick={createOrder}
          >
            {creatingOrder ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Create Order • ₹{total}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invoice Dialog */}
      <InvoiceDialog
        order={createdOrder}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </div>
  );
};

export default AdminHomeDelivery;
