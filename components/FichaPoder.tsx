"use client";

import { motion } from "framer-motion";

/**
 * Ficha de Poder no formato dos handbooks antigos: cinco atributos numa escala
 * de 1 a 7. Nulo significa "não avaliado" e não conta em média nem ranking.
 */
export const ATRIBUTOS = [
  { chave: "articulacao", rotulo: "Articulação" },
  { chave: "pintura", rotulo: "Pintura" },
  { chave: "acessorios", rotulo: "Acessórios" },
  { chave: "semelhanca", rotulo: "Semelhança" },
  { chave: "raridade", rotulo: "Raridade" },
] as const;

export type AtributoChave = (typeof ATRIBUTOS)[number]["chave"];
export type NotasFicha = Partial<Record<AtributoChave, number | null>>;

export const NOTA_MAX = 7;

/** Média das notas preenchidas; null quando nada foi avaliado. */
export function mediaFicha(notas: NotasFicha): number | null {
  const vals = ATRIBUTOS.map((a) => notas[a.chave]).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function Barra({ valor, rotulo, atraso }: { valor: number | null; rotulo: string; atraso: number }) {
  const preenchido = valor ?? 0;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <span className="w-20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {rotulo}
      </span>
      <span className="flex gap-1" aria-hidden>
        {Array.from({ length: NOTA_MAX }, (_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.25, delay: atraso + i * 0.03 }}
            className={`h-3 flex-1 rounded-sm ${
              i < preenchido ? "bg-primary" : "bg-surface-high"
            }`}
          />
        ))}
      </span>
      <span className="w-6 text-right text-xs tabular-nums text-foreground">
        {valor ?? "—"}
      </span>
    </div>
  );
}

export function FichaPoder({ notas }: { notas: NotasFicha }) {
  const media = mediaFicha(notas);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="caption-box">Ficha de Poder</span>
        {media != null && (
          <span className="display-title text-2xl text-gold">{media.toFixed(1)}</span>
        )}
      </div>

      {media == null ? (
        <p className="text-sm text-muted-foreground">
          Ainda não avaliada. Abra a edição e dê notas de 1 a 7.
        </p>
      ) : (
        <div className="space-y-2.5">
          {ATRIBUTOS.map((a, i) => (
            <Barra
              key={a.chave}
              rotulo={a.rotulo}
              valor={notas[a.chave] ?? null}
              atraso={i * 0.05}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Campos de nota para o formulário de edição. */
export function CamposFichaPoder({ initial }: { initial: NotasFicha }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {ATRIBUTOS.map((a) => (
        <label key={a.chave} className="block">
          <span className="eyebrow mb-2 block">{a.rotulo}</span>
          <input
            type="number"
            min={0}
            max={NOTA_MAX}
            name={a.chave}
            defaultValue={initial[a.chave] ?? ""}
            placeholder="1-7"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
          />
        </label>
      ))}
    </div>
  );
}
