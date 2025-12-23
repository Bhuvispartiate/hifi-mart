import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronLeft, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/grocery/ProductCard';
import { CartDrawer } from '@/components/grocery/CartDrawer';
import { BottomNav } from '@/components/grocery/BottomNav';
import { DeliveryActionBar } from '@/components/grocery/DeliveryActionBar';
import { categories, products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('cat') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (catId: string) => {
    if (catId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ cat: catId });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 h-10 rounded-xl text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Category Pills */}
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'secondary'}
              className={cn(
                'px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
              onClick={() => handleCategoryClick('all')}
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap',
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.icon} {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} products found
          </p>
          <Button variant="ghost" size="sm" className="text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Filters
          </Button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <DeliveryActionBar />
      <BottomNav />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Categories;
