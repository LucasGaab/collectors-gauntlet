"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { readNavIds } from "@/lib/navIds";

export function Modal({
  children,
  currentId,
}: {
  children: React.ReactNode;
  /** Id da peça aberta — habilita a navegação ← → dentro do modal. */
  currentId?: string;
}) {
  const router = useRouter();

  const close = useCallback(() => router.back(), [router]);

  // Ordem publicada pela listagem: respeita filtros e ordenação da tela de origem.
  const navIds = useMemo(() => (currentId ? readNavIds() : []), [currentId]);
  const index = currentId ? navIds.indexOf(currentId) : -1;
  const prevId = index > 0 ? navIds[index - 1] : null;
  const nextId = index >= 0 && index < navIds.length - 1 ? navIds[index + 1] : null;

  const goTo = useCallback(
    (id: string | null) => {
      // replace (e não push) pra que Esc/voltar feche o modal em vez de
      // desfazer uma peça de cada vez.
      if (id) router.replace(`/figuras/${id}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }

      // Setas não navegam enquanto o usuário edita um campo do formulário.
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (typing) return;

      if (e.key === "ArrowLeft" && prevId) {
        e.preventDefault();
        goTo(prevId);
      } else if (e.key === "ArrowRight" && nextId) {
        e.preventDefault();
        goTo(nextId);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [close, goTo, prevId, nextId]);

  const arrowClass =
    "grid size-10 place-items-center rounded-full border border-border bg-surface/90 text-foreground backdrop-blur transition-colors hover:border-primary/60 hover:text-primary disabled:cursor-default disabled:opacity-25 disabled:hover:border-border disabled:hover:text-foreground";

  return (
    <motion.div
      data-modal-open
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-2 py-4 backdrop-blur-sm sm:items-center sm:p-4 sm:py-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-4xl overflow-hidden rounded-card border border-border bg-surface shadow-card-hover"
      >
        {children}
      </motion.div>

      {index >= 0 && navIds.length > 1 && (
        <>
          {/* Setas laterais só a partir de sm: no celular o modal ocupa quase
              toda a largura e elas ficariam por cima do conteúdo. */}
          <div className="fixed left-4 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
            <button
              type="button"
              onClick={() => goTo(prevId)}
              disabled={!prevId}
              aria-label="Peça anterior (seta esquerda)"
              title="Peça anterior (←)"
              className={arrowClass}
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>
          <div className="fixed right-4 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
            <button
              type="button"
              onClick={() => goTo(nextId)}
              disabled={!nextId}
              aria-label="Próxima peça (seta direita)"
              title="Próxima peça (→)"
              className={arrowClass}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* No mobile a navegação vive na pílula inferior, com alvos de toque. */}
          <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface/95 px-2 py-1 backdrop-blur sm:gap-0 sm:px-3">
            <button
              type="button"
              onClick={() => goTo(prevId)}
              disabled={!prevId}
              aria-label="Peça anterior"
              className="grid size-8 place-items-center rounded-full text-foreground transition-colors disabled:opacity-25 sm:hidden"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="whitespace-nowrap px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {index + 1} / {navIds.length}
              <span className="hidden sm:inline"> · ← →</span>
            </span>
            <button
              type="button"
              onClick={() => goTo(nextId)}
              disabled={!nextId}
              aria-label="Próxima peça"
              className="grid size-8 place-items-center rounded-full text-foreground transition-colors disabled:opacity-25 sm:hidden"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
