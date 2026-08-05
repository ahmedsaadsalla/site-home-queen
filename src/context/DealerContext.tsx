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

export type DealerPublic = {
  id: string;
  status: string;
  cnpj: string;
  companyName: string;
  tradeName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  state: string;
  city: string;
  stateRegistration?: string;
  blocked?: boolean;
  priceTable?: string;
  globalMinOrder?: number;
  discountPercent?: number;
  creditLimit?: number;
  carrier?: string;
  region?: string;
  paymentMethod?: string;
};

type DealerContextValue = {
  dealer: DealerPublic | null;
  loading: boolean;
  isReseller: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setDealer: (dealer: DealerPublic | null) => void;
};

const DealerContext = createContext<DealerContextValue | null>(null);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealer, setDealer] = useState<DealerPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/atacado/me");
      const data = (await res.json()) as {
        authenticated?: boolean;
        dealer?: DealerPublic;
      };
      if (data.authenticated && data.dealer) {
        setDealer(data.dealer);
      } else {
        setDealer(null);
      }
    } catch {
      setDealer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/atacado/logout", { method: "POST" });
    setDealer(null);
  }, []);

  const value = useMemo(
    () => ({
      dealer,
      loading,
      isReseller: Boolean(dealer),
      refresh,
      logout,
      setDealer,
    }),
    [dealer, loading, refresh, logout],
  );

  return (
    <DealerContext.Provider value={value}>{children}</DealerContext.Provider>
  );
}

export function useDealer() {
  const ctx = useContext(DealerContext);
  if (!ctx) {
    throw new Error("useDealer must be used within DealerProvider");
  }
  return ctx;
}
