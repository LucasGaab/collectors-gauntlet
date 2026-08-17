"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, LayoutGrid, Rows3, BookOpen, ChevronDown, X } from "lucide-react";

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
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggleOpen}
        className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
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
      {/* Desktop: dropdown ancorado ao botão. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-full z-30 mt-2 hidden w-56 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-2xl md:block"
          >
            <OptionList group={group} selected={selected} onToggle={toggle} />
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Mobile: bottom sheet num portal. Não pode ser `absolute` como no desktop
        porque a faixa de filtros é rolável horizontalmente, e `overflow-x` recorta
        filhos posicionados — o menu ficaria cortado/rolando junto.
      */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div data-filter-sheet className="fixed inset-0 z-[120] md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={onToggleOpen} />
            <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">{group.label}</span>
                <button
                  type="button"
                  onClick={onToggleOpen}
                  aria-label="Fechar filtro"
                  className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <OptionList group={group} selected={selected} onToggle={toggle} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function OptionList({
  group,
  selected,
  onToggle,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (group.options.length === 0) {
    return <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum valor</p>;
  }

  return (
    <>
      {group.options.map((o) => {
        const key = optionKey(o, group.valueKey);
        const on = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-foreground/5 md:py-1.5"
          >
            <span
              className={`size-4 shrink-0 rounded-sm border md:size-3 ${on ? "border-primary bg-primary" : "border-border"}`}
            />
            <span
              className="inline-flex items-center rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: o.corBg, color: o.corFg }}
            >
              {optionLabel(o)}
            </span>
          </button>
        );
      })}
    </>
  );
}

export type Visao = "table" | "grid" | "hq";

export function FilterBar({
  groups,
  view,
  count,
}: {
  groups: FilterGroup[];
  view: Visao;
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
      const target = e.target as Node;
      // O bottom sheet do mobile vive num portal (fora do containerRef), então
      // cliques dentro dele não podem contar como "clique fora".
      if ((target as HTMLElement).closest?.("[data-filter-sheet]")) return;
      if (containerRef.current && !containerRef.current.contains(target)) setOpenKey(null);
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

  function setView(next: Visao) {
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
    <div ref={containerRef} className="glass-card rounded-2xl border border-border p-4 md:p-5">
      <div className="flex items-center gap-2 md:gap-4">
        {/* min-w-0 (em vez de min-w-64) deixa a busca encolher sem forçar quebra de linha. */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            data-search-input
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome, personagem ou linha...  ( / )"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </div>
        {/* No mobile os rótulos somem: sobram os dois ícones. */}
        <div className="flex shrink-0 gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Ver como catálogo"
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors md:px-4 ${
              view === "grid"
                ? "border-border bg-surface-high text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-3.5" /> <span className="hidden md:inline">Catálogo</span>
          </button>
          <button
            type="button"
            onClick={() => setView("hq")}
            aria-label="Ver como página de quadrinho"
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors md:px-4 ${
              view === "hq"
                ? "border-border bg-surface-high text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" /> <span className="hidden md:inline">Página HQ</span>
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label="Ver como tabela"
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors md:px-4 ${
              view === "table"
                ? "border-border bg-surface-high text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="size-3.5" /> <span className="hidden md:inline">Tabela</span>
          </button>
        </div>
      </div>

      {/*
        Mobile: faixa de uma linha só, rolável na horizontal — antes os 9 filtros
        quebravam em várias linhas e a barra ocupava metade da tela.
        Desktop (sm+): volta a quebrar linha normalmente.
      */}
      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1 md:mt-4 md:flex-wrap md:overflow-x-visible md:pb-0">
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
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            <X className="size-3" /> Limpar {activeFilterCount}
          </button>
        ) : null}
        {/* Dentro da faixa rolável o `ml-auto` jogaria o contador pro fim do
            scroll (invisível no mobile), então ele só aparece aqui no desktop. */}
        <span className="ml-auto hidden text-[10px] uppercase tracking-widest text-muted-foreground md:block">
          {count} peça{count === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mt-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground md:hidden">
        {count} peça{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}
