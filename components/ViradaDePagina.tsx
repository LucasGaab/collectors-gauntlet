"use client";

import { usePathname } from "next/navigation";

/**
 * Virada de página (item 07): na troca de rota, um sulco preto atravessa a tela
 * — o gesto de um painel de quadrinho dando lugar ao próximo.
 *
 * Duas decisões deliberadas, as duas por segurança:
 *
 * 1. A posição de repouso é FORA da tela, no próprio style. A primeira versão
 *    ficava em repouso sobre o conteúdo e dependia da animação para sair; quando
 *    a animação não rodava, sobrava um retângulo preto cobrindo metade da página.
 *    Agora a falha significa "invisível", não "tela coberta".
 * 2. A animação é CSS pura, e não framer-motion. O `key` é o pathname, então
 *    cada navegação remonta o elemento e o browser reexecuta o keyframe sozinho.
 */
export function ViradaDePagina() {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      aria-hidden
      style={{
        transform: "translateX(-120%) skewX(-8deg)",
        animation: "varrer-painel 620ms cubic-bezier(0.65, 0, 0.35, 1) 1",
      }}
      className="pointer-events-none fixed inset-y-0 left-0 z-[250] w-[45vw] bg-black shadow-[0_0_80px_30px_rgba(0,0,0,0.9)] motion-reduce:hidden"
    />
  );
}
