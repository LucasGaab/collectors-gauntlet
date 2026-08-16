"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";

const MESSAGES: Record<string, string> = {
  criada: "Figura adicionada à coleção.",
  atualizada: "Alterações salvas.",
};

export function ToastFromQuery() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");

  useEffect(() => {
    if (!toastKey) return;
    showToast(MESSAGES[toastKey] ?? "Feito.");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastKey]);

  return null;
}
