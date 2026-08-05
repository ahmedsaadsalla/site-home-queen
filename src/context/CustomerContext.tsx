"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CustomerPublic } from "@/data/customer";

type CustomerContextValue = {
  customer: CustomerPublic | null;
  loading: boolean;
  isCustomer: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setCustomer: (customer: CustomerPublic | null) => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cliente/me");
      const data = (await res.json()) as {
        authenticated?: boolean;
        customer?: CustomerPublic;
      };
      if (data.authenticated && data.customer) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/cliente/logout", { method: "POST" });
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      loading,
      isCustomer: Boolean(customer),
      refresh,
      logout,
      setCustomer,
    }),
    [customer, loading, refresh, logout],
  );

  return (
    <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    throw new Error("useCustomer must be used within CustomerProvider");
  }
  return ctx;
}
