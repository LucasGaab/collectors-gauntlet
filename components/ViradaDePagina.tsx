"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Virada de página (item 07): na troca de rota, um sulco preto atravessa a tela
 * — o gesto de um painel de quadrinho dando lugar ao próximo.
 *
 * Sem estado nem efeito: o `key` é o próprio pathname, então cada navegação
 * remonta o elemento e reexecuta a animação de entrada. Rastrear a rota anterior
 * em estado exigiria setState dentro de efeito, que o React 19 desaconselha.
 *
 * Decorativo e `pointer-events-none`: nunca bloqueia clique durante a passagem.
 */
export function ViradaDePagina() {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      aria-hidden
      initial={{ x: "-110%" }}
      animate={{ x: "115%" }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      className="pointer-events-none fixed inset-y-0 left-0 z-[250] w-[45vw] -skew-x-6 bg-black shadow-[0_0_80px_30px_rgba(0,0,0,0.9)] motion-reduce:hidden"
    />
  );
}
