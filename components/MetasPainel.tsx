"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Trophy } from "lucide-react";
import type { MetaProgresso } from "@/lib/queries";

function BarraMeta({ item, hrefBase }: { item: MetaProgresso; hrefBase: string }) {
  const pct = item.alvo > 0 ? Math.round((item.tenho / item.alvo) * 100) : 0;
  const faltam = Math.max(item.alvo - item.tenho, 0);
  const completo = faltam === 0;

  return (
    <Link
      href={`${hrefBase}=${item.id}`}
      className="group block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: item.corBg, color: item.corFg }}
        >
          {item.nome}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
          {completo ? (
            <>
              <Trophy className="size-3.5 text-gold" />
              <span className="text-gold">Completo</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              faltam <span className="text-foreground">{faltam}</span>
            </span>
          )}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full ${completo ? "bg-gold" : "bg-primary"}`}
        />
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {item.tenho} de {item.alvo} · {pct}%
        {item.metaManual && <Target className="size-3" aria-label="meta definida manualmente" />}
      </p>
    </Link>
  );
}

/**
 * Progresso da coleção por Grupo e por Conjunto. Cada barra leva para a
 * listagem já filtrada por aquele grupo/conjunto.
 */
export function MetasPainel({
  grupos,
  conjuntos,
}: {
  grupos: MetaProgresso[];
  conjuntos: MetaProgresso[];
}) {
  if (grupos.length === 0 && conjuntos.length === 0) return null;

  return (
    <div className="space-y-6">
      {grupos.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Progresso por grupo</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {grupos.map((g) => (
              <BarraMeta key={g.id} item={g} hrefBase="/?grupo" />
            ))}
          </div>
        </section>
      )}

      {conjuntos.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Progresso por conjunto</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {conjuntos.map((c) => (
              <BarraMeta key={c.id} item={c} hrefBase="/?conjunto" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
