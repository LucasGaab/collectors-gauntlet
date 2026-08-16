"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { TEMAS, type Preferencias } from "@/lib/preferencias";
import { salvarPreferencias } from "@/lib/actions/preferencias";
import { useToast } from "@/components/Toast";

/** Amostra de cores de cada tema, só para o seletor — os valores reais vivem no CSS. */
const AMOSTRAS: Record<string, [string, string, string]> = {
  obsidian: ["#141416", "#ED1D24", "#E8C468"],
  cosmico: ["#1B1226", "#A855F7", "#F0CE73"],
  simbionte: ["#0E0E0E", "#FFFFFF", "#9A9A9A"],
  gama: ["#12201A", "#5DE07A", "#A855F7"],
  asgard: ["#141C2E", "#F0C674", "#EBD9A0"],
  noir: ["#121214", "#C43A3F", "#A9A9AE"],
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60";

export function PreferenciasForm({ prefs }: { prefs: Preferencias }) {
  const [tema, setTema] = useState(prefs.tema);
  const [densidade, setDensidade] = useState(prefs.densidade);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tema", tema);
    fd.set("densidade", String(densidade));
    startTransition(async () => {
      await salvarPreferencias(fd);
      showToast("Preferências salvas.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section>
        <p className="caption-box mb-4">Tema do universo</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMAS.map((t) => {
            const ativo = tema === t.id;
            const [bg, p1, p2] = AMOSTRAS[t.id] ?? AMOSTRAS.obsidian;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTema(t.id)}
                aria-pressed={ativo}
                className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition-colors ${
                  ativo ? "border-primary" : "border-border hover:border-primary/40"
                }`}
                style={{ backgroundColor: bg }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="size-4 rounded-full" style={{ backgroundColor: p1 }} />
                  <span className="size-4 rounded-full" style={{ backgroundColor: p2 }} />
                  {ativo && <Check className="ml-auto size-4 text-primary" />}
                </span>
                <span className="mt-2 block text-sm font-bold text-white">{t.nome}</span>
                <span className="block text-[10px] leading-tight text-white/60">{t.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Salvar recarrega o app inteiro com a nova paleta.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow mb-2 block">Nome da coleção</span>
          <input
            name="nomeColecao"
            defaultValue={prefs.nomeColecao ?? ""}
            placeholder="Ex: A Manopla do Lucas"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Aparece no topo da vitrine, no lugar do nome do produto.
          </span>
        </label>

        <label className="block">
          <span className="eyebrow mb-2 block">Orçamento mensal (R$)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="orcamentoMensal"
            defaultValue={prefs.orcamentoMensal ?? ""}
            placeholder="Ex: 500"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Usado no dashboard para dizer o que cabe no mês.
          </span>
        </label>
      </section>

      <section>
        <span className="eyebrow mb-2 block">Densidade do catálogo</span>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={3}
            max={7}
            step={1}
            value={densidade}
            onChange={(e) => setDensidade(Number(e.target.value))}
            className="w-full max-w-xs accent-[var(--primary)]"
          />
          <span className="display-title text-2xl text-gold">{densidade}</span>
          <span className="text-xs text-muted-foreground">colunas em tela grande</span>
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="graoPapel"
            defaultChecked={prefs.graoPapel}
            className="size-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            Grão de papel
            <span className="block text-xs text-muted-foreground">
              Textura sutil de papel de polpa sobre a interface.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="somAmbiente"
            defaultChecked={prefs.somAmbiente}
            className="size-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            Som no modo apresentação
            <span className="block text-xs text-muted-foreground">
              Clique discreto de vitrine ao trocar de peça.
            </span>
          </span>
        </label>
      </section>

      <div className="flex justify-end border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar preferências"}
        </button>
      </div>
    </form>
  );
}
