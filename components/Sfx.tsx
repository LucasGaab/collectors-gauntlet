"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Letreiro de onomatopeia (item 02).
 *
 * Usa CustomEvent em vez de contexto React de propósito: o disparo acontece de
 * lugares muito diferentes — server action que redireciona, handler de exclusão,
 * duplicação — e enfiar um provider em todos eles seria plumbing sem ganho.
 * Basta chamar `sfx("THWIP")` de qualquer código de cliente.
 */
const EVENTO = "gauntlet:sfx";

export type Onomatopeia = "THWIP" | "SNIKT" | "KRAKOOM" | "BAMF" | "POOF";

/** Cor por tipo de ação: conquista é dourada, destruição é vermelha. */
const CORES: Record<Onomatopeia, string> = {
  THWIP: "var(--gold)",
  SNIKT: "var(--gold)",
  KRAKOOM: "var(--gold)",
  BAMF: "var(--primary)",
  POOF: "var(--primary)",
};

export function sfx(palavra: Onomatopeia) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: palavra }));
}

type Item = { id: number; palavra: Onomatopeia };
let proximoId = 1;

export function SfxLayer() {
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    function aoDisparar(e: Event) {
      const palavra = (e as CustomEvent<Onomatopeia>).detail;
      const id = proximoId++;
      setItens((prev) => [...prev, { id, palavra }]);
      setTimeout(() => setItens((prev) => prev.filter((i) => i.id !== id)), 900);
    }
    window.addEventListener(EVENTO, aoDisparar);
    return () => window.removeEventListener(EVENTO, aoDisparar);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[400] grid place-items-center motion-reduce:hidden"
      aria-hidden
    >
      <AnimatePresence>
        {itens.map((item) => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, scale: 0.3, rotate: -14 }}
            animate={{ opacity: 1, scale: [0.3, 1.18, 1], rotate: [-14, -6, -9] }}
            exit={{ opacity: 0, scale: 1.5, y: -30 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{ color: CORES[item.palavra], gridArea: "1 / 1" }}
            className="letreiro-sfx select-none text-6xl sm:text-8xl"
          >
            {item.palavra}!
          </motion.span>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
