import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// ============= TYPES =============

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  discount?: number;
  inStock: boolean;
  brand?: string;
  rating?: number;
  description?: string;
  nutritionInfo?: string;
  shelfLife?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  validUntil: string;
  minOrder: number;
  discount: number;
  maxDiscount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  productId?: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  deliveryPartner?: {
    name: string;
    phone: string;
    rating: number;
  };
  timeline: {
    status: string;
    time: string;
    completed: boolean;
  }[];
  eta?: string;
  deliveredAt?: string;
  cancelledReason?: string;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserCart {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
}

// ============= PRODUCTS =============

export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'), where('category', '==', categoryId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
};

// ============= CATEGORIES =============

export const getCategories = async (): Promise<Category[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// ============= REVIEWS =============

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

// ============= OFFERS =============

export const getOffers = async (): Promise<Offer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'offers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
};

// ============= BANNERS =============

export const getBanners = async (): Promise<Banner[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'banners'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

// ============= ORDERS =============

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], updates?: Partial<Order>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status, ...updates });
    return true;
  } catch (error) {
    console.error('Error updating order:', error);
    return false;
  }
};

// ============= CART =============

export const getUserCart = async (userId: string): Promise<CartItem[]> => {
  try {
    const docRef = doc(db, 'carts', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
};

export const saveUserCart = async (userId: string, items: CartItem[]): Promise<boolean> => {
  try {
    const docRef = doc(db, 'carts', userId);
    await setDoc(docRef, {
      userId,
      items,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error saving cart:', error);
    return false;
  }
};

export const clearUserCart = async (userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'carts', userId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// ============= SEED DATA =============

export const seedProducts = async (products: Omit<Product, 'id'>[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    products.forEach((product, index) => {
      const docRef = doc(db, 'products', String(index + 1));
      batch.set(docRef, product);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding products:', error);
    return false;
  }
};

export const seedCategories = async (categories: Category[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    categories.forEach((category) => {
      const docRef = doc(db, 'categories', category.id);
      batch.set(docRef, category);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding categories:', error);
    return false;
  }
};

export const seedOffers = async (offers: Offer[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    offers.forEach((offer) => {
      const docRef = doc(db, 'offers', offer.id);
      batch.set(docRef, offer);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding offers:', error);
    return false;
  }
};

export const seedBanners = async (banners: Banner[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    banners.forEach((banner) => {
      const docRef = doc(db, 'banners', banner.id);
      batch.set(docRef, banner);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding banners:', error);
    return false;
  }
};

export const seedReviews = async (reviews: Review[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    reviews.forEach((review) => {
      const docRef = doc(db, 'reviews', review.id);
      batch.set(docRef, review);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding reviews:', error);
    return false;
  }
};
