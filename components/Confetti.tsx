"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const CORES = ["#ED1D24", "#E8C468", "#F5F5F7", "#C98F3A"];
const QUANTIDADE = 28;

/**
 * Comemoração curta ao conquistar uma peça (sai da wishlist e entra na coleção).
 * Puro DOM + framer-motion, sem canvas nem dependência nova. Some sozinho e
 * respeita prefers-reduced-motion.
 */
export function Confetti() {
  // Quem monta decide quanto tempo o confete fica em tela (ver ToastFromQuery).
  // A preferência de menos movimento é tratada em CSS (motion-reduce:hidden),
  // sem estado nem media query em JS.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[300] overflow-hidden motion-reduce:hidden"
      aria-hidden
    >
      {Array.from({ length: QUANTIDADE }, (_, i) => {
        // Pseudo-aleatório derivado do índice: mantém o render puro (Math.random
        // durante o render produz resultado instável a cada re-render) e o
        // espalhamento continua parecendo natural.
        const r = (n: number) => {
          const x = Math.sin((i + 1) * n) * 10000;
          return x - Math.floor(x);
        };
        const esquerda = r(12.9898) * 100;
        const atraso = r(78.233) * 0.25;
        const giro = (r(43.758) - 0.5) * 720;
        const deriva = (r(93.989) - 0.5) * 160;
        const duracao = 1.4 + r(27.61) * 0.5;
        return (
          <motion.span
            key={i}
            initial={{ top: "-6%", left: `${esquerda}%`, opacity: 1, rotate: 0, x: 0 }}
            animate={{ top: "108%", x: deriva, rotate: giro, opacity: [1, 1, 0] }}
            transition={{ duration: duracao, delay: atraso, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: 8,
              height: 12,
              borderRadius: 2,
              backgroundColor: CORES[i % CORES.length],
            }}
          />
        );
      })}
    </div>,
    document.body,
  );
}
