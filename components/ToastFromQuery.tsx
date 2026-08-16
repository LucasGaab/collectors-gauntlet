"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Confetti } from "@/components/Confetti";

const MESSAGES: Record<string, string> = {
  criada: "Figura adicionada à coleção.",
  atualizada: "Alterações salvas.",
  conquistada: "Conquistada! A peça saiu da wishlist e entrou na coleção.",
};

/** Tempo que o confete precisa em tela antes de a URL ser limpa. */
const DURACAO_COMEMORACAO = 2000;

export function ToastFromQuery() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const comemorar = toastKey === "conquistada";

  useEffect(() => {
    if (!toastKey) return;
    showToast(MESSAGES[toastKey] ?? "Feito.");

    // A limpeza do ?toast desmonta o confete, então ela espera a animação.
    // Sem estado local: o próprio parâmetro da URL é a fonte da verdade.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const query = params.toString();
    const destino = query ? `${pathname}?${query}` : pathname;

    const t = setTimeout(
      () => router.replace(destino, { scroll: false }),
      toastKey === "conquistada" ? DURACAO_COMEMORACAO : 0,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastKey]);

  return comemorar ? <Confetti /> : null;
}
