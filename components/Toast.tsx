"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";
type ToastAction = { label: string; onClick: () => void };
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
};

type ToastOptions = { action?: ToastAction; durationMs?: number };

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success", options?: ToastOptions) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant, action: options?.action }]);
      // Toasts com ação (ex: "Desfazer") ficam mais tempo na tela.
      const duration = options?.durationMs ?? (options?.action ? 8000 : 3000);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex items-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-medium shadow-card ${
                t.variant === "success"
                  ? "border-primary/40 bg-surface-high text-foreground"
                  : "border-red-500/40 bg-surface-high text-foreground"
              }`}
            >
              {t.variant === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 text-primary" />
              ) : (
                <XCircle size={18} className="shrink-0 text-red-400" />
              )}
              {t.message}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="ml-2 shrink-0 rounded-full border border-primary/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
