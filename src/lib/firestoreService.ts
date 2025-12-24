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
  Timestamp,
  onSnapshot
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
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'reached_destination' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  deliveryPartnerId?: string;
  timeline: {
    status: string;
    time: string;
    completed: boolean;
  }[];
  eta?: string;
  deliveredAt?: string;
  cancelledReason?: string;
  createdAt: Date;
  deliveryOtp?: string;
  otpGeneratedAt?: Date;
}

export interface UserAddress {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  addresses: UserAddress[];
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    // Simple query without orderBy to avoid requiring composite index
    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    });
    // Sort client-side by createdAt descending
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

// ============= USER PROFILES =============

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createUserProfile = async (
  userId: string, 
  profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export const addUserAddress = async (
  userId: string,
  address: Omit<UserAddress, 'id'>
): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    const newAddress: UserAddress = {
      ...address,
      id: `addr-${Date.now()}`,
    };

    // If this is the first address or marked as default, update other addresses
    let updatedAddresses = [...profile.addresses];
    if (address.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);

    return await updateUserProfile(userId, { addresses: updatedAddresses });
  } catch (error) {
    console.error('Error adding address:', error);
    return false;
  }
};

export const updateUserAddress = async (
  userId: string,
  addressId: string,
  updates: Partial<Omit<UserAddress, 'id'>>
): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    let updatedAddresses = profile.addresses.map(a => 
      a.id === addressId ? { ...a, ...updates } : a
    );

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      updatedAddresses = updatedAddresses.map(a => 
        a.id === addressId ? a : { ...a, isDefault: false }
      );
    }

    return await updateUserProfile(userId, { addresses: updatedAddresses });
  } catch (error) {
    console.error('Error updating address:', error);
    return false;
  }
};

export const deleteUserAddress = async (
  userId: string,
  addressId: string
): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    const updatedAddresses = profile.addresses.filter(a => a.id !== addressId);
    return await updateUserProfile(userId, { addresses: updatedAddresses });
  } catch (error) {
    console.error('Error deleting address:', error);
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

export const seedOrders = async (orders: Array<Omit<Order, 'createdAt'> & { id: string }>): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    orders.forEach((order) => {
      const { id, ...orderData } = order;
      const docRef = doc(db, 'orders', id);
      batch.set(docRef, {
        ...orderData,
        createdAt: Timestamp.now(),
      });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error seeding orders:', error);
    return false;
  }
};

// ============= DELIVERY PARTNERS =============

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  vehicleType: 'bike' | 'scooter' | 'bicycle';
  rating: number;
  totalDeliveries: number;
  joinedAt: Date;
  lastDeliveryAt?: Date;
  currentOrderId?: string;
}

export const getDeliveryPartners = async (): Promise<DeliveryPartner[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'deliveryPartners'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate() || new Date(),
      } as DeliveryPartner;
    });
  } catch (error) {
    console.error('Error fetching delivery partners:', error);
    return [];
  }
};

export const createDeliveryPartner = async (partner: Omit<DeliveryPartner, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'deliveryPartners'), {
      ...partner,
      joinedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating delivery partner:', error);
    return null;
  }
};

export const updateDeliveryPartner = async (id: string, updates: Partial<DeliveryPartner>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'deliveryPartners', id);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating delivery partner:', error);
    return false;
  }
};

export const deleteDeliveryPartner = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'deliveryPartners', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting delivery partner:', error);
    return false;
  }
};

// Get available delivery partner with oldest last delivery (for fair assignment)
export const getAvailableDeliveryPartner = async (): Promise<DeliveryPartner | null> => {
  try {
    const partners = await getDeliveryPartners();
    
    // Filter active partners who don't have a current order
    const availablePartners = partners.filter(p => p.isActive && !p.currentOrderId);
    
    if (availablePartners.length === 0) return null;
    
    // Sort by lastDeliveryAt (oldest first, or partners with no delivery history first)
    availablePartners.sort((a, b) => {
      if (!a.lastDeliveryAt) return -1;
      if (!b.lastDeliveryAt) return 1;
      return a.lastDeliveryAt.getTime() - b.lastDeliveryAt.getTime();
    });
    
    return availablePartners[0];
  } catch (error) {
    console.error('Error getting available delivery partner:', error);
    return null;
  }
};

// Auto-assign order to delivery partner
export const autoAssignDeliveryPartner = async (orderId: string): Promise<DeliveryPartner | null> => {
  try {
    const partner = await getAvailableDeliveryPartner();
    if (!partner) {
      console.log('No available delivery partner for order:', orderId);
      return null;
    }

    // Update order with delivery partner info
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      deliveryPartnerId: partner.id,
      deliveryPartner: {
        id: partner.id,
        name: partner.name,
        phone: partner.phone,
        rating: partner.rating,
      },
    });

    // Update partner with current order
    const partnerRef = doc(db, 'deliveryPartners', partner.id);
    await updateDoc(partnerRef, {
      currentOrderId: orderId,
    });

    console.log(`Order ${orderId} assigned to delivery partner ${partner.name}`);
    return partner;
  } catch (error) {
    console.error('Error auto-assigning delivery partner:', error);
    return null;
  }
};

// Generate 4-digit OTP for delivery verification
export const generateDeliveryOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Set delivery OTP when reaching destination
export const setDeliveryOtp = async (orderId: string): Promise<string | null> => {
  try {
    const otp = generateDeliveryOtp();
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      deliveryOtp: otp,
      otpGeneratedAt: Timestamp.now(),
    });
    return otp;
  } catch (error) {
    console.error('Error setting delivery OTP:', error);
    return null;
  }
};

// Verify OTP and mark as delivered
export const verifyDeliveryOtp = async (orderId: string, enteredOtp: string): Promise<boolean> => {
  try {
    const order = await getOrderById(orderId);
    if (!order || !order.deliveryOtp) return false;

    if (order.deliveryOtp !== enteredOtp) {
      console.log('OTP mismatch for order:', orderId);
      return false;
    }

    // OTP verified - mark as delivered
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      deliveryOtp: null, // Clear OTP after use
    });

    // Update delivery partner stats
    if (order.deliveryPartnerId) {
      const partnerRef = doc(db, 'deliveryPartners', order.deliveryPartnerId);
      const partnerSnap = await getDoc(partnerRef);
      if (partnerSnap.exists()) {
        const partnerData = partnerSnap.data();
        await updateDoc(partnerRef, {
          totalDeliveries: (partnerData.totalDeliveries || 0) + 1,
          lastDeliveryAt: Timestamp.now(),
          currentOrderId: null, // Free up the partner
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    return false;
  }
};

// ============= PRODUCT CRUD =============

export const createProduct = async (product: Omit<Product, 'id'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'products'), product);
    return docRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// ============= CATEGORY CRUD =============

export const createCategory = async (category: Category): Promise<string | null> => {
  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category);
    return category.id;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

// ============= USER ROLE MANAGEMENT =============

export interface UserRole {
  id: string;
  userId: string;
  role: 'admin' | 'delivery_partner' | 'customer';
  createdAt: Date;
  createdBy?: string;
}

export const checkUserRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'user_roles'),
      where('userId', '==', userId),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

export const getUserByPhone = async (phoneNumber: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    return null;
  }
};

// ============= OFFLINE ORDERS =============

export const createOfflineOrder = async (order: {
  customerPhone: string;
  customerName: string;
  deliveryAddress: string;
  deliveryCoordinates?: { lat: number; lng: number };
  items: OrderItem[];
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
}): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      userId: 'walk-in',
      date: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      total: order.total,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      deliveryCoordinates: order.deliveryCoordinates,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      paymentMethod: order.paymentMethod,
      isOfflineOrder: true,
      timeline: [
        { status: 'Order Placed', time: new Date().toISOString(), completed: true },
      ],
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating offline order:', error);
    return null;
  }
};

// ============= ADMIN ORDERS =============

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    });
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
};

// ============= REAL-TIME LISTENERS =============

export const subscribeToAllOrders = (
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = collection(db, 'orders');
  
  return onSnapshot(q, 
    (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });
      // Sort client-side
      orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(orders);
    },
    (error) => {
      console.error('Real-time orders error:', error);
      onError?.(error);
    }
  );
};

export const subscribeToOrder = (
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const docRef = doc(db, 'orders', orderId);
  
  return onSnapshot(docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Real-time order error:', error);
      onError?.(error);
    }
  );
};
