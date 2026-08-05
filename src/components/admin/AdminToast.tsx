"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastItem = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

type ToastCtx = {
  push: (message: string, type?: ToastItem["type"]) => void;
};

const Ctx = createContext<ToastCtx>({ push: () => undefined });

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = `t_${Date.now().toString(36)}`;
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-4 py-3 text-[13px] shadow-2xl ${
              t.type === "error"
                ? "border-red-400/40 bg-[#2a1515] text-red-100"
                : t.type === "info"
                  ? "border-white/15 bg-[#1a1a1c] text-white/90"
                  : "border-[#C8A96A]/40 bg-[#1a1812] text-[#F8F8F6]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAdminToast() {
  return useContext(Ctx);
}
