"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: "currency";
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    // Garante o valor final mesmo se requestAnimationFrame for suprimido
    // (aba em segundo plano, prefers-reduced-motion, etc.)
    const fallback = setTimeout(() => setDisplay(value), 700);
    return () => {
      controls.stop();
      clearTimeout(fallback);
    };
  }, [value]);

  const formatted =
    format === "currency" ? CURRENCY_FORMATTER.format(display) : Math.round(display).toString();

  return <span className="tabular-nums">{formatted}</span>;
}
