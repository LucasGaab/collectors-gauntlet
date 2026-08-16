"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FigureTable, type FigureRow, type OptionColorMap } from "@/components/FigureTable";
import { FigureGrid } from "@/components/FigureGrid";
import { ViewTransition } from "@/components/ViewTransition";
import { BulkActionBar } from "@/components/BulkActionBar";
import { CompararModal } from "@/components/CompararModal";
import { NAV_IDS_STORAGE_KEY } from "@/lib/navIds";

/**
 * Casca client da listagem: guarda a seleção para edição em lote e publica a
 * ordem atual das peças pra que o modal de detalhe consiga navegar com ← →
 * respeitando os filtros e a ordenação da tela de origem.
 */
export function CollectionBody({
  figures,
  view,
  optionColors,
  searchParamsString,
  statuses,
}: {
  figures: FigureRow[];
  view: "table" | "grid";
  optionColors: OptionColorMap;
  searchParamsString: string;
  statuses: { id: string; valor: string }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparando, setComparando] = useState(false);

  const ids = useMemo(() => figures.map((f) => f.id), [figures]);

  useEffect(() => {
    sessionStorage.setItem(NAV_IDS_STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  // Uma peça excluída ou filtrada fora da tela não pode continuar selecionada.
  // Derivado no render (em vez de sincronizado por efeito) pra não disparar
  // uma renderização em cascata a cada mudança de filtro.
  const visibleSelected = useMemo(
    () => selected.filter((id) => ids.includes(id)),
    [selected, ids],
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const visible = prev.filter((id) => ids.includes(id));
      return visible.length === ids.length ? [] : [...ids];
    });
  }, [ids]);

  const clear = useCallback(() => setSelected([]), []);

  return (
    <>
      <ViewTransition viewKey={view}>
        {view === "table" ? (
          <FigureTable
            figures={figures}
            searchParamsString={searchParamsString}
            optionColors={optionColors}
            selected={visibleSelected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        ) : (
          <FigureGrid
            figures={figures}
            optionColors={optionColors}
            selected={visibleSelected}
            onToggle={toggle}
          />
        )}
      </ViewTransition>

      <AnimatePresence>
        {visibleSelected.length > 0 && (
          <BulkActionBar
            selectedIds={visibleSelected}
            statuses={statuses}
            onClear={clear}
            onComparar={visibleSelected.length >= 2 ? () => setComparando(true) : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comparando && (
          <CompararModal
            pecas={figures.filter((f) => visibleSelected.includes(f.id)).slice(0, 3)}
            optionColors={optionColors}
            aoFechar={() => setComparando(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
