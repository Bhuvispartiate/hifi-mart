import { useState, useEffect } from 'react';
import { 
  getProducts, 
  getCategories, 
  getOffers, 
  getBanners,
  getProductById,
  getProductsByCategory,
  getProductReviews,
  getUserOrders,
  getOrderById,
  subscribeToUserOrders,
  Product,
  Category,
  Offer,
  Banner,
  Review,
  Order
} from '@/lib/firestoreService';

// ============= PRODUCTS HOOK =============

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error, refetch: async () => {
    const data = await getProducts();
    setProducts(data);
  }};
};

export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
        setError(null);
      } catch (err) {
        setError('Failed to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return { product, loading, error };
};

export const useProductsByCategory = (categoryId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProductsByCategory(categoryId);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchProducts();
    }
  }, [categoryId]);

  return { products, loading, error };
};

// ============= CATEGORIES HOOK =============

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// ============= OFFERS HOOK =============

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const data = await getOffers();
        setOffers(data);
        setError(null);
      } catch (err) {
        setError('Failed to load offers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return { offers, loading, error };
};

// ============= BANNERS HOOK =============

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const data = await getBanners();
        setBanners(data);
        setError(null);
      } catch (err) {
        setError('Failed to load banners');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return { banners, loading, error };
};

// ============= REVIEWS HOOK =============

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await getProductReviews(productId);
        setReviews(data);
        setError(null);
      } catch (err) {
        setError('Failed to load reviews');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  return { reviews, loading, error };
};

// ============= ORDERS HOOK =============

export const useUserOrders = (userId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Use real-time subscription for auto-refresh
    const unsubscribe = subscribeToUserOrders(
      userId,
      (data) => {
        setOrders(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError('Failed to load orders');
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { orders, loading, error };
};

export const useOrder = (orderId: string | undefined) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError('Failed to load order');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error };
};
