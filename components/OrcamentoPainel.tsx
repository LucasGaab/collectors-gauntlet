import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Orcamento } from "@/lib/insights";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_PRIORIDADE: Record<string, string> = {
  alta: "cobiça alta",
  media: "cobiça média",
  baixa: "cobiça baixa",
};

/**
 * Meta de orçamento (item 16). Só aparece quando existe um teto em
 * Preferências. O "gasto do mês" soma as peças que entraram na coleção no mês
 * corrente — a data de conquista quando há, o cadastro quando não há.
 */
export function OrcamentoPainel({ orcamento }: { orcamento: Orcamento }) {
  const { teto, gastoNoMes, restante, valorWishlist, mesesDeWishlist, proximaCompra } = orcamento;
  const usado = Math.min(1, teto > 0 ? gastoNoMes / teto : 0);
  const estourou = gastoNoMes > teto;

  return (
    <div className="glass-card rounded-2xl border border-border p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="caption-box">Orçamento do mês</p>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Teto de {brl(teto)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="eyebrow mb-1">{estourou ? "Passou do teto em" : "Ainda cabe"}</p>
          <span
            className={`display-title block text-4xl ${estourou ? "text-destructive" : "text-gold"}`}
          >
            {brl(estourou ? gastoNoMes - teto : restante)}
          </span>
        </div>
        <div>
          <p className="eyebrow mb-1">Gasto no mês</p>
          <span className="display-title block text-2xl">{brl(gastoNoMes)}</span>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-high">
        <div
          className={`h-full rounded-full ${estourou ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${Math.round(usado * 100)}%` }}
        />
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-5">
        {mesesDeWishlist != null && (
          <p className="text-xs text-muted-foreground">
            A wishlist inteira ({brl(valorWishlist)}) consumiria{" "}
            <span className="font-bold text-foreground">
              {mesesDeWishlist.toFixed(1).replace(".", ",")} meses
            </span>{" "}
            de orçamento.
          </p>
        )}

        {proximaCompra ? (
          <Link
            href={`/figuras/${proximaCompra.id}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/60"
          >
            <span className="min-w-0">
              <span className="eyebrow block">Cabe no que sobrou</span>
              <span className="mt-1 block truncate text-sm font-semibold transition-colors group-hover:text-primary">
                {proximaCompra.nome}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {proximaCompra.personagem}
                {proximaCompra.prioridade
                  ? ` · ${ROTULO_PRIORIDADE[proximaCompra.prioridade] ?? proximaCompra.prioridade}`
                  : ""}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums text-gold">
              {brl(proximaCompra.preco)}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nada da wishlist com preço cabe no que sobrou do mês.
          </p>
        )}
      </div>
    </div>
  );
}
