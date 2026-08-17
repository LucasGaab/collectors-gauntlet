"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListChecks, SkipForward, X } from "lucide-react";
import type { PrecoDefasado } from "@/lib/insights";
import { conferirPreco } from "@/lib/actions/figures";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function desdeQuando(dias: number | null): string {
  if (dias == null) return "Nunca conferido";
  if (dias < 60) return `${dias} dias atrás`;
  const meses = Math.round(dias / 30);
  if (meses < 18) return `${meses} meses atrás`;
  return `${(meses / 12).toFixed(1).replace(".", ",")} anos atrás`;
}

const inputPreco =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60";

/**
 * Fila de revisão (item 19): uma peça por vez, com o preço atual já no campo.
 * A ordem é congelada ao abrir a fila — conferir uma peça a tira da lista do
 * servidor, e reordenar no meio da revisão faria a próxima peça pular sozinha.
 */
function Fila({
  pecas,
  onFechar,
  onConferida,
}: {
  pecas: PrecoDefasado[];
  onFechar: () => void;
  onConferida: (id: string) => void;
}) {
  const [indice, setIndice] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const atual = pecas[indice];
  const fim = indice >= pecas.length;

  function avancar() {
    setIndice((i) => i + 1);
  }

  function confirmar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atual) return;
    const bruto = (new FormData(e.currentTarget).get("preco") ?? "").toString().trim();
    const preco = bruto === "" ? null : Number(bruto.replace(",", "."));
    const id = atual.id;

    startTransition(async () => {
      await conferirPreco(id, preco);
      onConferida(id);
      avancar();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-border p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="caption-box">
          {fim ? "Fila concluída" : `Revisando ${indice + 1} de ${pecas.length}`}
        </span>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Sair da fila"
          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {fim || !atual ? (
        <div className="py-10 text-center">
          <p className="display-title text-2xl">Fila zerada.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Todos os preços da fila passaram pela sua revisão.
          </p>
          <button
            type="button"
            onClick={() => {
              onFechar();
              showToast("Revisão encerrada.");
            }}
            className="mt-6 rounded-full bg-primary px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover"
          >
            Voltar à lista
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-[140px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
            {atual.thumbUrl ? (
              <Image src={atual.thumbUrl} alt={atual.nome} fill sizes="140px" unoptimized className="object-cover" />
            ) : (
              <ImagePlaceholder />
            )}
          </div>

          <div className="min-w-0">
            <Badge label={atual.marca.nome} corBg={atual.marca.corBg} corFg={atual.marca.corFg} />
            <h3 className="display-title mt-2 text-2xl">{atual.nome}</h3>
            <p className="text-sm text-muted-foreground">{atual.personagem}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {desdeQuando(atual.diasSemConferir)}
              {atual.precoEstimado != null && ` · registrado a ${brl(atual.precoEstimado)}`}
            </p>

            {/* key por peça: o campo volta ao preço da peça seguinte em vez de
                manter o valor digitado na anterior. */}
            <form key={atual.id} onSubmit={confirmar} className="mt-5 space-y-3">
              <label className="block">
                <span className="eyebrow mb-2 block">Preço de hoje (R$)</span>
                <input
                  name="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  defaultValue={atual.precoEstimado ?? ""}
                  placeholder="Deixe vazio para marcar sem preço"
                  className={inputPreco}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover disabled:opacity-50"
                >
                  <Check className="size-3.5" /> Conferido
                </button>
                <button
                  type="button"
                  onClick={avancar}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <SkipForward className="size-3.5" /> Pular
                </button>
                <Link
                  href={`/figuras/${atual.id}`}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                  Abrir ficha
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function PrecosPainel({ pecas, meses }: { pecas: PrecoDefasado[]; meses: number }) {
  // Conferir revalida o servidor, mas a peça some da lista só na próxima
  // renderização — este conjunto tira ela da tela na hora.
  const [conferidas, setConferidas] = useState<string[]>([]);
  const [fila, setFila] = useState<PrecoDefasado[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const pendentes = pecas.filter((p) => !conferidas.includes(p.id));

  function marcarConferida(id: string) {
    setConferidas((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function conferirAgora(p: PrecoDefasado) {
    startTransition(async () => {
      // Sem valor: só carimba a data, confirmando que o preço atual segue valendo.
      await conferirPreco(p.id);
      marcarConferida(p.id);
      showToast(`Preço de "${p.nome}" confirmado hoje.`);
    });
  }

  if (pendentes.length === 0) {
    return (
      <EmptyState
        title="Nenhum preço defasado"
        description={`Toda peça do acervo teve o preço conferido nos últimos ${meses} meses.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="display-title text-3xl text-gold">{pendentes.length}</span>{" "}
          {pendentes.length === 1 ? "peça sem conferência" : "peças sem conferência"} há mais de{" "}
          {meses} meses.
        </p>
        {!fila && (
          <button
            type="button"
            onClick={() => setFila(pendentes)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover"
          >
            <ListChecks className="size-3.5" /> Revisar em fila
          </button>
        )}
      </div>

      <AnimatePresence>
        {fila && (
          <Fila pecas={fila} onFechar={() => setFila(null)} onConferida={marcarConferida} />
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-2xl border border-border">
        {pendentes.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3 last:border-b-0"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-high">
              {p.thumbUrl ? (
                <Image src={p.thumbUrl} alt="" fill sizes="48px" unoptimized className="object-cover" />
              ) : null}
            </div>

            <Link href={`/figuras/${p.id}`} className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold transition-colors hover:text-primary">
                {p.nome}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {p.personagem} · {p.marca.nome} · {desdeQuando(p.diasSemConferir)}
              </span>
            </Link>

            <span className="shrink-0 text-sm tabular-nums text-gold">
              {p.precoEstimado != null ? brl(p.precoEstimado) : "—"}
            </span>

            <button
              type="button"
              onClick={() => conferirAgora(p)}
              disabled={isPending}
              title="Confirmar que o preço segue valendo"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
