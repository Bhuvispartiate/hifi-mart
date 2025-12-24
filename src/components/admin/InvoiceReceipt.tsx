import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Order, OrderItem } from '@/lib/firestoreService';

interface InvoiceReceiptProps {
  order: Order;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceReceiptProps>(({
  order,
  storeName = 'Fresh Grocery Store',
  storeAddress = '123 Main Street, City, State 12345',
  storePhone = '+91 98765 43210',
}, ref) => {
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = 30;
  const discount = Math.round(subtotal * 0.1);
  const total = order.total || (subtotal - discount + deliveryFee);

  return (
    <div ref={ref} className="bg-card p-6 max-w-md mx-auto font-mono text-sm print:p-4 print:max-w-full">
      {/* Header */}
      <div className="text-center border-b border-dashed border-border pb-4 mb-4">
        <h1 className="text-xl font-bold text-foreground">{storeName}</h1>
        <p className="text-muted-foreground text-xs mt-1">{storeAddress}</p>
        <p className="text-muted-foreground text-xs">Phone: {storePhone}</p>
      </div>

      {/* Invoice Details */}
      <div className="border-b border-dashed border-border pb-4 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Invoice #:</span>
          <span className="font-semibold text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Date:</span>
          <span className="text-foreground">{format(order.createdAt, 'dd MMM yyyy, hh:mm a')}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-muted-foreground">Status:</span>
          <span className="capitalize text-foreground">{order.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Customer Info */}
      {order.deliveryAddress && (
        <div className="border-b border-dashed border-border pb-4 mb-4">
          <p className="text-xs text-muted-foreground">Delivery Address:</p>
          <p className="text-xs text-foreground mt-1">{order.deliveryAddress}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="border-b border-dashed border-border pb-4 mb-4">
        <div className="flex text-xs font-bold text-foreground mb-2">
          <span className="flex-1">Item</span>
          <span className="w-12 text-center">Qty</span>
          <span className="w-16 text-right">Price</span>
          <span className="w-16 text-right">Total</span>
        </div>
        {order.items.map((item: OrderItem, index: number) => (
          <div key={index} className="flex text-xs text-foreground py-1">
            <span className="flex-1 truncate pr-2">{item.name}</span>
            <span className="w-12 text-center">{item.qty}</span>
            <span className="w-16 text-right">₹{item.price}</span>
            <span className="w-16 text-right">₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs text-foreground">
          <span>Subtotal:</span>
          <span>₹{subtotal}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs text-success">
            <span>Discount:</span>
            <span>-₹{discount}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-foreground">
          <span>Delivery Fee:</span>
          <span>₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-dashed border-border">
          <span>TOTAL:</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-t border-dashed border-border pt-4 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Payment Method:</span>
          <span className="text-foreground capitalize">Cash</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-dashed border-border">
        <p className="text-xs text-muted-foreground">Thank you for shopping with us!</p>
        <p className="text-xs text-muted-foreground mt-1">Visit again soon</p>
      </div>
    </div>
  );
});

InvoiceReceipt.displayName = 'InvoiceReceipt';

export default InvoiceReceipt;
