import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Minus, Plus, Heart, Share2, Clock, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart, CartItem } from '@/contexts/CartContext';
import { getProductById, getRelatedProducts, getProductReviews } from '@/data/products';
import { ProductCard } from '@/components/grocery/ProductCard';
import { DeliveryActionBar } from '@/components/grocery/DeliveryActionBar';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, addItem, updateQuantity } = useCart();

  const product = getProductById(id || '');
  const relatedProducts = getRelatedProducts(id || '', 4);
  const productReviews = getProductReviews(id || '');

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Product not found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  const cartItem = items.find((item: CartItem) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const averageRating = productReviews.length > 0 
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : (product.rating?.toFixed(1) || '4.5');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-72 object-cover"
        />
        {product.discount && (
          <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
            {product.discount}% OFF
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            {product.brand && (
              <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
            )}
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.unit}</p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium text-primary">{averageRating}</span>
            <span className="text-xs text-muted-foreground">({productReviews.length || 0})</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold text-foreground">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-lg text-muted-foreground line-through">
              ₹{product.originalPrice}
            </span>
          )}
          {product.discount && product.originalPrice && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Save ₹{product.originalPrice - product.price}
            </Badge>
          )}
        </div>

        {/* Add to Cart */}
        <div className="mb-6">
          {quantity === 0 ? (
            <Button 
              onClick={() => addItem(product)} 
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-4 bg-primary/10 rounded-lg p-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="h-10 w-10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold text-foreground w-12 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
            <Truck className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">10-15 mins</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">{product.shelfLife || '7 days'}</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
            <ShieldCheck className="h-5 w-5 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Quality Assured</span>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">About this product</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description || 'Fresh and high-quality product sourced from trusted suppliers.'}
          </p>
        </div>

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Nutrition Information</h2>
            <p className="text-sm text-muted-foreground">{product.nutritionInfo}</p>
          </div>
        )}

        <Separator className="mb-6" />

        {/* Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Reviews ({productReviews.length})
            </h2>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{averageRating}</span>
            </div>
          </div>

          {productReviews.length > 0 ? (
            <div className="space-y-4">
              {productReviews.map(review => (
                <div key={review.id} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {review.userName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{review.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating 
                              ? 'fill-primary text-primary' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(review.date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                    <span>{review.helpful} found helpful</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground">Be the first to review this product</p>
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Related Products</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      <DeliveryActionBar />
    </div>
  );
};

export default ProductDetail;
