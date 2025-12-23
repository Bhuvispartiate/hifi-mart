import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/firestoreService';
import { getUserCart, saveUserCart, clearUserCart, CartItem as FirestoreCartItem, getProductById } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart from Firestore when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        setLoading(true);
        try {
          const cartItems = await getUserCart(user.uid);
          if (cartItems.length > 0) {
            // Fetch full product details for each cart item
            const fullItems: CartItem[] = [];
            for (const item of cartItems) {
              const product = await getProductById(item.productId);
              if (product) {
                fullItems.push({ ...product, quantity: item.quantity });
              }
            }
            setItems(fullItems);
          }
        } catch (error) {
          console.error('Error loading cart:', error);
        }
        setLoading(false);
      } else {
        // Clear cart when user logs out
        setItems([]);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to Firestore whenever it changes (for logged-in users)
  useEffect(() => {
    const saveCart = async () => {
      if (user && items.length > 0) {
        const cartItems: FirestoreCartItem[] = items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        }));
        await saveUserCart(user.uid, cartItems);
      }
    };

    // Debounce save to avoid too many writes
    const timeoutId = setTimeout(saveCart, 500);
    return () => clearTimeout(timeoutId);
  }, [items, user]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = async () => {
    setItems([]);
    if (user) {
      await clearUserCart(user.uid);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = totalPrice >= 299 ? 0 : 25;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        deliveryFee,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
