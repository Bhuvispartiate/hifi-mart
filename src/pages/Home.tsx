import { useState } from 'react';
import { Header } from '@/components/grocery/Header';
import { HeroBanner } from '@/components/grocery/HeroBanner';
import { CategoryCard } from '@/components/grocery/CategoryCard';
import { ProductCard } from '@/components/grocery/ProductCard';
import { CartDrawer } from '@/components/grocery/CartDrawer';
import { BottomNav } from '@/components/grocery/BottomNav';
import { categories, products } from '@/data/products';

const Home = () => {
  const [cartOpen, setCartOpen] = useState(false);
  
  const bestSellers = products.filter(p => p.rating && p.rating >= 4.5).slice(0, 8);
  const discountedProducts = products.filter(p => p.discount).slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header onCartClick={() => setCartOpen(true)} />

      <main className="space-y-6 py-4">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Categories Grid */}
        <section className="px-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Shop by Category
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {categories.slice(0, 8).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* Best Deals */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              🔥 Best Deals
            </h2>
            <span className="text-xs text-primary font-medium">See all</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              ⭐ Best Sellers
            </h2>
            <span className="text-xs text-primary font-medium">See all</span>
          </div>
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="w-36"
                />
              ))}
            </div>
          </div>
        </section>

        {/* All Products */}
        <section className="px-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            All Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Home;
