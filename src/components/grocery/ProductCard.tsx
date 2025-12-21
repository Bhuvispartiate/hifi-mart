import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card border border-border rounded-xl p-3 transition-all hover:shadow-md',
        className
      )}
    >
      {product.discount && (
        <Badge className="absolute top-2 left-2 z-10 bg-discount text-discount-foreground text-[10px] px-1.5 py-0.5">
          {product.discount}% OFF
        </Badge>
      )}

      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground">{product.unit}</p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {quantity === 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => addItem(product)}
              className="h-8 px-3 text-xs font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-1 bg-primary rounded-lg overflow-hidden">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80 rounded-none"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-5 text-center text-sm font-semibold text-primary-foreground">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80 rounded-none"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
