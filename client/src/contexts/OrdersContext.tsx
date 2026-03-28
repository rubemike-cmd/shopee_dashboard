import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { orders as defaultOrdersData } from '@/data/orders';
import type { Order } from '@/hooks/useOrdersAnalysis';

interface OrdersContextType {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  lastUpload: { filename: string; uploadedAt: Date; totalOrders: number } | null;
  setLastUpload: (info: { filename: string; uploadedAt: Date; totalOrders: number }) => void;
  resetToDefault: () => void;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrdersState] = useState<Order[]>(defaultOrdersData as Order[]);
  const [lastUpload, setLastUploadState] = useState<{
    filename: string;
    uploadedAt: Date;
    totalOrders: number;
  } | null>(null);

  const setOrders = useCallback((newOrders: Order[]) => {
    setOrdersState(newOrders);
  }, []);

  const setLastUpload = useCallback(
    (info: { filename: string; uploadedAt: Date; totalOrders: number }) => {
      setLastUploadState(info);
    },
    []
  );

  const resetToDefault = useCallback(() => {
    setOrdersState(defaultOrdersData as Order[]);
    setLastUploadState(null);
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, setOrders, lastUpload, setLastUpload, resetToDefault }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider');
  return ctx;
}
