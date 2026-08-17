"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Troca entre Catálogo, Tabela e Página HQ com um crossfade curto.
 *
 * Sem `initial={false}` de propósito: aquele sinalizador desliga a animação de
 * entrada na primeira montagem e **se propaga para os descendentes**, o que
 * matava o Stagger dos cards do catálogo — a Coleção e a Wishlist abriam
 * estáticas enquanto Dashboard e Listas, que usam Stagger sem este wrapper,
 * animavam normalmente.
 */
export function ViewTransition({
  viewKey,
  children,
}: {
  viewKey: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
