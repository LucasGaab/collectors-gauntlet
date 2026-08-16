"use client";

import { useState, useTransition } from "react";
import { Columns3, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { bulkUpdateStatus, bulkDeleteFigures, bulkRestoreFigures } from "@/lib/actions/figures";
import { useToast } from "@/components/Toast";

export function BulkActionBar({
  selectedIds,
  statuses,
  onClear,
  onComparar,
}: {
  selectedIds: string[];
  statuses: { id: string; valor: string }[];
  onClear: () => void;
  /** Só chega definido com 2+ peças selecionadas. */
  onComparar?: () => void;
}) {
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const count = selectedIds.length;

  function applyStatus(valor: string) {
    setStatus(valor);
    if (!valor) return;
    const ids = [...selectedIds];
    startTransition(async () => {
      await bulkUpdateStatus(ids, valor);
      showToast(`${ids.length} peça${ids.length === 1 ? "" : "s"} movida${ids.length === 1 ? "" : "s"} para "${valor}".`);
      setStatus("");
      onClear();
    });
  }

  function handleDelete() {
    const ids = [...selectedIds];
    startTransition(async () => {
      await bulkDeleteFigures(ids);
      showToast(`${ids.length} peça${ids.length === 1 ? "" : "s"} removida${ids.length === 1 ? "" : "s"}.`, "success", {
        action: {
          label: "Desfazer",
          onClick: () => startTransition(() => bulkRestoreFigures(ids)),
        },
      });
      onClear();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      // No mobile: acima da navbar inferior, ocupando a largura com quebra de
      // linha (em linha única a barra passaria de 375px).
      className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-surface-high px-4 py-3 shadow-card-hover md:bottom-6 md:w-auto md:flex-nowrap md:gap-4 md:rounded-full md:px-5"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
        {count} selecionada{count === 1 ? "" : "s"}
      </span>

      <select
        value={status}
        disabled={isPending}
        onChange={(e) => applyStatus(e.target.value)}
        aria-label="Mudar status das peças selecionadas"
        className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs outline-none transition-colors focus:border-primary/60 disabled:opacity-50"
      >
        <option value="">Mudar status para...</option>
        {statuses.map((s) => (
          <option key={s.id} value={s.valor}>
            {s.valor}
          </option>
        ))}
      </select>

      {onComparar && (
        <button
          type="button"
          onClick={onComparar}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          <Columns3 className="size-3.5" /> Comparar
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-3.5" /> Excluir
      </button>

      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar seleção"
        className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}
