"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const ALTURA_EM = 1.05;

/**
 * Um dígito que "gira" até o valor final, como roleta de contador mecânico.
 * A coluna 0-9 é deslocada em Y; só o dígito da vez fica visível pela máscara.
 */
function Digito({ valor, atraso }: { valor: number; atraso: number }) {
  return (
    <span
      className="inline-block overflow-hidden align-bottom"
      style={{ height: `${ALTURA_EM}em` }}
      aria-hidden
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: `-${valor * ALTURA_EM}em` }}
        transition={{ duration: 0.9, delay: atraso, ease: [0.16, 1, 0.3, 1] }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} style={{ height: `${ALTURA_EM}em`, lineHeight: `${ALTURA_EM}em` }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function AnimatedNumber({ value, format }: { value: number; format?: "currency" }) {
  const [display, setDisplay] = useState(0);

  // Moeda continua com interpolação (roleta em 7 caracteres com R$, ponto e
  // vírgula ficaria ilegível); inteiros ganham a roleta.
  useEffect(() => {
    if (format !== "currency") return;
    const controls = animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    const fallback = setTimeout(() => setDisplay(value), 700);
    return () => {
      controls.stop();
      clearTimeout(fallback);
    };
  }, [value, format]);

  if (format === "currency") {
    return <span className="tabular-nums">{CURRENCY_FORMATTER.format(display)}</span>;
  }

  const texto = Math.round(value).toString();

  return (
    <span className="inline-flex tabular-nums leading-none">
      {/* Texto acessível: os dígitos animados ficam aria-hidden. */}
      <span className="sr-only">{texto}</span>
      {texto.split("").map((c, i) => (
        <Digito key={`${i}-${c}`} valor={Number(c)} atraso={i * 0.06} />
      ))}
    </span>
  );
}
