import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  seedProducts, 
  seedCategories, 
  seedOffers, 
  seedBanners,
  seedReviews
} from '@/lib/firestoreService';

// Import mock data
import { 
  products as mockProducts, 
  categories as mockCategories, 
  offers as mockOffers, 
  banners as mockBanners,
  reviews as mockReviews
} from '@/data/products';

interface SeedStatus {
  products: 'idle' | 'loading' | 'success' | 'error';
  categories: 'idle' | 'loading' | 'success' | 'error';
  offers: 'idle' | 'loading' | 'success' | 'error';
  banners: 'idle' | 'loading' | 'success' | 'error';
  reviews: 'idle' | 'loading' | 'success' | 'error';
}

const AdminSeed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<SeedStatus>({
    products: 'idle',
    categories: 'idle',
    offers: 'idle',
    banners: 'idle',
    reviews: 'idle',
  });
  const [isSeeding, setIsSeeding] = useState(false);

  const seedAllData = async () => {
    setIsSeeding(true);

    // Seed Categories
    setStatus(prev => ({ ...prev, categories: 'loading' }));
    const categoriesSuccess = await seedCategories(mockCategories);
    setStatus(prev => ({ ...prev, categories: categoriesSuccess ? 'success' : 'error' }));

    // Seed Products
    setStatus(prev => ({ ...prev, products: 'loading' }));
    const productsData = mockProducts.map(({ id, ...rest }) => rest);
    const productsSuccess = await seedProducts(productsData);
    setStatus(prev => ({ ...prev, products: productsSuccess ? 'success' : 'error' }));

    // Seed Offers
    setStatus(prev => ({ ...prev, offers: 'loading' }));
    const offersSuccess = await seedOffers(mockOffers);
    setStatus(prev => ({ ...prev, offers: offersSuccess ? 'success' : 'error' }));

    // Seed Banners
    setStatus(prev => ({ ...prev, banners: 'loading' }));
    const bannersSuccess = await seedBanners(mockBanners);
    setStatus(prev => ({ ...prev, banners: bannersSuccess ? 'success' : 'error' }));

    // Seed Reviews
    setStatus(prev => ({ ...prev, reviews: 'loading' }));
    const reviewsSuccess = await seedReviews(mockReviews);
    setStatus(prev => ({ ...prev, reviews: reviewsSuccess ? 'success' : 'error' }));

    setIsSeeding(false);

    const allSuccess = categoriesSuccess && productsSuccess && offersSuccess && bannersSuccess && reviewsSuccess;
    
    if (allSuccess) {
      toast({
        title: 'Data Seeded Successfully! 🎉',
        description: 'All mock data has been uploaded to Firestore',
      });
    } else {
      toast({
        title: 'Partial Success',
        description: 'Some data failed to seed. Check the status below.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (s: 'idle' | 'loading' | 'success' | 'error') => {
    switch (s) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Database className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const seedItems = [
    { key: 'categories', label: 'Categories', count: mockCategories.length },
    { key: 'products', label: 'Products', count: mockProducts.length },
    { key: 'offers', label: 'Offers', count: mockOffers.length },
    { key: 'banners', label: 'Banners', count: mockBanners.length },
    { key: 'reviews', label: 'Reviews', count: mockReviews.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Admin - Seed Data</h1>
            <p className="text-sm opacity-80">Upload mock data to Firestore</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card className="p-4 border border-border">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Seed Firestore Database
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This will upload all mock data from the app to your Firebase Firestore database. 
            Click the button below to seed all collections.
          </p>

          <div className="space-y-3 mb-6">
            {seedItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status[item.key as keyof SeedStatus])}
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.count} items</span>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={seedAllData}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Seed All Data to Firestore
              </>
            )}
          </Button>
        </Card>

        <Card className="p-4 border border-border bg-muted/30">
          <h3 className="font-medium text-foreground mb-2">⚠️ Important Notes</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• This will overwrite existing data with the same IDs</li>
            <li>• Make sure your Firebase project has Firestore enabled</li>
            <li>• The app will start using Firestore data after seeding</li>
            <li>• You only need to run this once</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default AdminSeed;
