"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CalendarClock,
  Heart,
  LayoutDashboard,
  Plus,
  Search,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";
import { searchFiguresQuick } from "@/lib/actions/figures";

type Figura = {
  id: string;
  nome: string;
  personagem: string;
  status: string;
  thumbUrl: string | null;
};

const COMANDOS = [
  { label: "Nova peça", href: "/nova", icon: Plus },
  { label: "Coleção", href: "/", icon: Boxes },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // Telas derivadas do acervo: não cabem na navbar (que já tem 5 no mobile),
  // então a paleta é o caminho rápido pra elas.
  { label: "Pódio da coleção", href: "/podio", icon: Trophy },
  { label: "Multiverso dos personagens", href: "/personagens", icon: Users },
  { label: "Preços defasados", href: "/precos", icon: CalendarClock },
  { label: "Listas auxiliares", href: "/listas", icon: SlidersHorizontal },
] as const;

/**
 * Paleta de comandos (⌘K / Ctrl+K): busca peças em toda a coleção e pula para
 * qualquer tela, sem depender dos filtros da página atual.
 */
export function CommandPalette() {
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [figuras, setFiguras] = useState<Figura[]>([]);
  const [indice, setIndice] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const comandosFiltrados = COMANDOS.filter((c) =>
    c.label.toLowerCase().includes(termo.trim().toLowerCase()),
  );
  const itens = [
    ...comandosFiltrados.map((c) => ({ tipo: "comando" as const, ...c })),
    ...figuras.map((f) => ({ tipo: "figura" as const, ...f })),
  ];

  const fechar = useCallback(() => {
    setAberta(false);
    setTermo("");
    setFiguras([]);
    setIndice(0);
  }, []);

  // Atalho global de abertura.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((v) => !v);
        return;
      }
      if (e.key === "Escape" && aberta) fechar();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [aberta, fechar]);

  // Busca com debounce; toda escrita de estado acontece dentro do timer.
  useEffect(() => {
    if (!aberta) return;
    let cancelado = false;
    const timer = setTimeout(async () => {
      const achados = termo.trim().length < 2 ? [] : await searchFiguresQuick(termo);
      if (!cancelado) {
        setFiguras(achados);
        setIndice(0);
      }
    }, 200);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo, aberta]);

  useEffect(() => {
    if (aberta) inputRef.current?.focus();
  }, [aberta]);

  function irPara(item: (typeof itens)[number]) {
    fechar();
    router.push(item.tipo === "comando" ? item.href : `/figuras/${item.id}`);
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => (itens.length ? (i + 1) % itens.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => (itens.length ? (i - 1 + itens.length) % itens.length : 0));
    } else if (e.key === "Enter" && itens[indice]) {
      e.preventDefault();
      irPara(itens[indice]);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {aberta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) fechar();
          }}
          className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-card-hover"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={onKeyDownInput}
                placeholder="Buscar peça ou ir para..."
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {itens.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {termo.trim().length < 2
                    ? "Digite pelo menos 2 letras para buscar peças."
                    : "Nada encontrado."}
                </p>
              ) : (
                itens.map((item, i) => {
                  const ativo = i === indice;
                  return (
                    <button
                      key={item.tipo === "comando" ? item.href : item.id}
                      type="button"
                      onMouseEnter={() => setIndice(i)}
                      onClick={() => irPara(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        ativo ? "bg-foreground/10" : ""
                      }`}
                    >
                      {item.tipo === "comando" ? (
                        <>
                          <item.icon className="size-4 shrink-0 text-primary" />
                          <span className="text-sm">{item.label}</span>
                        </>
                      ) : (
                        <>
                          <span className="size-4 shrink-0 rounded-sm bg-primary/20" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{item.nome}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {item.personagem} · {item.status}
                            </span>
                          </span>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
