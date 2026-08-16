"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LayoutGrid, Rows3, ChevronDown, X } from "lucide-react";

type OptionLike = { id?: string; nome?: string; valor?: string; corBg: string; corFg: string };

export type FilterGroup = {
  key: string;
  label: string;
  options: OptionLike[];
  /**
   * "id" filtra pela chave estrangeira (Marca/Grupo, onde Figure guarda o id).
   * "valor" filtra pelo texto (Escala/Estilo/Alinhamento/Tipo/Status/FaixaPreco,
   * onde Figure guarda o valor literal, não o id da Option).
   */
  valueKey?: "id" | "valor";
};

function optionKey(o: OptionLike, valueKey: "id" | "valor" = "id") {
  if (valueKey === "valor") return o.valor ?? o.id ?? "";
  return o.id ?? o.valor ?? "";
}

function optionLabel(o: OptionLike) {
  return o.nome ?? o.valor ?? "";
}

function FilterDropdown({
  group,
  selected,
  open,
  onToggleOpen,
  onChange,
}: {
  group: FilterGroup;
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (key: string, values: string[]) => void;
}) {
  const count = selected.length;

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(group.key, next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
          count > 0
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {group.label}
        {count > 0 ? (
          <span className="grid size-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">
            {count}
          </span>
        ) : (
          <ChevronDown className="size-3" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-full z-30 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-2xl"
          >
            {group.options.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum valor</p>
            ) : (
              group.options.map((o) => {
                const key = optionKey(o, group.valueKey);
                const on = selected.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/5"
                  >
                    <span
                      className={`size-3 rounded-sm border ${on ? "border-primary bg-primary" : "border-border"}`}
                    />
                    <span
                      className="inline-flex items-center rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: o.corBg, color: o.corFg }}
                    >
                      {optionLabel(o)}
                    </span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterBar({
  groups,
  view,
  count,
}: {
  groups: FilterGroup[];
  view: "table" | "grid";
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpenKey(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleFilterChange(key: string, values: string[]) {
    pushParams((params) => {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    });
  }

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        if (value.trim()) params.set("q", value.trim());
        else params.delete("q");
      });
    }, 300);
  }

  function setView(next: "table" | "grid") {
    pushParams((params) => params.set("view", next));
  }

  function clearAll() {
    setQ("");
    router.push(pathname, { scroll: false });
  }

  const activeFilterCount = groups.reduce(
    (acc, g) => acc + (searchParams.get(g.key)?.split(",").filter(Boolean).length ?? 0),
    0,
  );

  return (
    <div ref={containerRef} className="glass-card rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            data-search-input
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome, personagem ou linha...  ( / )"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              view === "grid"
                ? "border-border bg-surface-high text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-3.5" /> Catálogo
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              view === "table"
                ? "border-border bg-surface-high text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="size-3.5" /> Tabela
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <FilterDropdown
            key={g.key}
            group={g}
            selected={searchParams.get(g.key)?.split(",").filter(Boolean) ?? []}
            open={openKey === g.key}
            onToggleOpen={() => setOpenKey((k) => (k === g.key ? null : g.key))}
            onChange={handleFilterChange}
          />
        ))}
        {activeFilterCount > 0 || q ? (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <X className="size-3" /> Limpar {activeFilterCount}
          </button>
        ) : null}
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
          {count} peça{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
