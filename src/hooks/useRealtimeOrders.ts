import { useState, useEffect } from 'react';
import { subscribeToAllOrders, subscribeToOrder, Order } from '@/lib/firestoreService';

export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllOrders(
      (updatedOrders) => {
        setOrders(updatedOrders);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Real-time orders error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { orders, loading, error };
};

export const useRealtimeOrder = (orderId: string | null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToOrder(
      orderId,
      (updatedOrder) => {
        setOrder(updatedOrder);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Real-time order error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  return { order, loading, error };
};
