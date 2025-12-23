import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, totalPrice, deliveryFee, clearCart } = useCart();

  const isEmpty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
            <SheetTitle className="text-lg font-semibold flex-1">
              Your Cart {items.length > 0 && `(${items.length})`}
            </SheetTitle>
            {!isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                Your cart is empty
              </h3>
              <p className="text-sm text-muted-foreground">
                Add items to get started
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-muted/50 rounded-xl p-3"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-card flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-foreground">
                        ₹{item.price * item.quantity}
                      </span>
                      <div className="flex items-center gap-1 bg-primary rounded-lg overflow-hidden">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-7 w-7 text-primary-foreground hover:bg-primary/80 rounded-none"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center text-sm font-semibold text-primary-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 text-primary-foreground hover:bg-primary/80 rounded-none"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border p-4 bg-card">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-primary font-medium' : 'font-medium'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{299 - totalPrice} more for free delivery
                  </p>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>₹{totalPrice + deliveryFee}</span>
                </div>
              </div>
              <Link to="/checkout" onClick={() => onOpenChange(false)}>
                <Button className="w-full h-12 text-base font-semibold">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
