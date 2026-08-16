"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LogoHorizontal } from "@/components/LogoMark";

/**
 * Faixa de marca do mobile: some ao rolar pra baixo e reaparece ao rolar pra
 * cima — o padrão de "header que se vai", pra devolver altura útil de tela.
 *
 * A posição é escrita direto no style via rAF (em vez de state a cada scroll)
 * pra não disparar re-render em toda rolagem.
 */
/** Manter em sincronia com o pt-[64px] do <main> e o top-[...64px] do header. */
const ALTURA = 64;
const LIMIAR = 8; // ignora microtremores de scroll

export function MobileBrandBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const ultimoY = useRef(0);
  const escondido = useRef(false);

  useEffect(() => {
    let frame = 0;

    function aoRolar() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - ultimoY.current;
        if (Math.abs(delta) < LIMIAR) return;

        // No topo sempre visível; senão, esconde descendo e mostra subindo.
        const deveEsconder = y > ALTURA && delta > 0;
        if (deveEsconder !== escondido.current) {
          escondido.current = deveEsconder;
          if (barRef.current) {
            barRef.current.style.transform = deveEsconder
              ? `translateY(-${ALTURA}px)`
              : "translateY(0)";
          }
          // O header sticky da página gruda logo abaixo desta faixa; quando ela
          // some, ele sobe pro topo em vez de deixar um vão.
          document.documentElement.style.setProperty(
            "--brand-offset",
            deveEsconder ? "0px" : `${ALTURA}px`,
          );
        }
        ultimoY.current = y;
      });
    }

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={barRef}
      style={{ height: ALTURA }}
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-center border-b border-border bg-background/85 backdrop-blur-md transition-transform duration-300 ease-out md:hidden"
    >
      <Link href="/" aria-label="Collector's Gauntlet — início">
        <LogoHorizontal height={38} />
      </Link>
    </div>
  );
}
