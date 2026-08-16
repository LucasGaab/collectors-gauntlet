"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2, X } from "lucide-react";
import type { Figure, Marca, Grupo, Conjunto } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Lightbox } from "@/components/Lightbox";
import { FigureForm, type FigureFormLists } from "@/components/FigureForm";
import { updateFigure, deleteFigure, restoreFigure, duplicateFigure } from "@/lib/actions/figures";
import { useToast } from "@/components/Toast";
import type { OptionColorMap } from "@/components/FigureTable";

type FigureWithRelations = Figure & { marca: Marca; grupo: Grupo; conjuntos: Conjunto[] };

const FALLBACK_COLOR = { corBg: "#EFEFEF", corFg: "#3D3D3D" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ATTRS: [string, string][] = [
  ["escala", "Escala"],
  ["estilo", "Estilo"],
  ["alinhamento", "Alinhamento"],
  ["tipo", "Tipo"],
  ["status", "Status"],
  ["faixaPreco", "Faixa de preço"],
];

export function FigureDetail({
  figure,
  lists,
  optionColors,
  initialMode = "view",
  isModal = false,
}: {
  figure: FigureWithRelations;
  lists: FigureFormLists;
  optionColors: OptionColorMap;
  initialMode?: "view" | "edit";
  isModal?: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const colorFor = (categoria: string, valor: string) =>
    optionColors[categoria]?.[valor] ?? FALLBACK_COLOR;

  function close() {
    if (isModal) router.back();
    else router.push("/");
  }

  // Vai pra lixeira e oferece "Desfazer" no toast — sem confirm() bloqueante.
  function handleDelete() {
    startTransition(async () => {
      await deleteFigure(figure.id);
      showToast(`"${figure.nome}" removida da coleção.`, "success", {
        action: {
          label: "Desfazer",
          onClick: () => startTransition(() => restoreFigure(figure.id)),
        },
      });
      close();
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const copy = await duplicateFigure(figure.id);
      if (!copy) return;
      showToast("Cópia criada — ajuste os dados da variante e salve.");
      // Mantém o contexto atual (modal continua modal, página continua página).
      router.replace(`/figuras/${copy.id}?edit=1`, { scroll: false });
    });
  }

  const updateAction = updateFigure.bind(null, figure.id);
  const attrValue = (key: string): string =>
    (figure as unknown as Record<string, string>)[key];

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="display-title text-lg text-foreground">
          {mode === "edit" ? "Editar peça" : figure.nome}
        </h2>
        <div className="flex items-center gap-1">
          {mode === "view" ? (
            <>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors hover:border-primary/60 hover:text-primary"
              >
                <Pencil className="size-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isPending}
                aria-label="Duplicar peça"
                title="Duplicar peça (cadastrar variante)"
                className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Excluir"
                className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {mode === "view" && (
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-6">
        {mode === "edit" ? (
          <FigureForm
            action={updateAction}
            lists={lists}
            initialData={figure}
            onCancel={() => setMode("view")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,300px)_1fr]">
            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-vitrine)]">
                {figure.imagemUrl ? (
                  <>
                    <Image
                      src={figure.imagemUrl}
                      alt={figure.nome}
                      fill
                      sizes="(max-width: 1024px) 100vw, 300px"
                      className="object-cover"
                    />
                    <Lightbox src={figure.imagemUrl} alt={figure.nome} />
                  </>
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="eyebrow">Preço estimado</span>
                <span className="display-title text-3xl text-gold">
                  {figure.precoEstimado != null ? brl(figure.precoEstimado) : "—"}
                </span>
              </div>
              <p className="mt-1 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                {figure.precoConferidoEm
                  ? `Preço conferido em ${figure.precoConferidoEm.toLocaleDateString("pt-BR")}`
                  : "Preço nunca conferido"}
              </p>
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-border p-6">
                <p className="eyebrow">Personagem</p>
                <p className="display-title mt-1 text-3xl">{figure.personagem || "—"}</p>
                {figure.linha && <p className="mt-1 text-sm text-muted-foreground">{figure.linha}</p>}

                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  <div className="min-w-0">
                    <p className="eyebrow mb-2">Marca</p>
                    <Badge label={figure.marca.nome} corBg={figure.marca.corBg} corFg={figure.marca.corFg} size="md" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow mb-2">Grupo</p>
                    <Badge label={figure.grupo.nome} corBg={figure.grupo.corBg} corFg={figure.grupo.corFg} size="md" />
                  </div>
                  {ATTRS.map(([key, label]) => (
                    <div key={key} className="min-w-0">
                      <p className="eyebrow mb-2">{label}</p>
                      <Badge label={attrValue(key)} {...colorFor(key, attrValue(key))} size="md" />
                    </div>
                  ))}
                </div>

                {figure.link && (
                  <a
                    href={figure.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-block text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                  >
                    Abrir link da loja
                  </a>
                )}
              </div>

              <div className="glass-card rounded-2xl border border-border p-6">
                <p className="eyebrow mb-4">Conjuntos</p>
                {figure.conjuntos.length ? (
                  <div className="flex flex-wrap gap-2">
                    {figure.conjuntos.map((c) => (
                      <Badge key={c.id} label={c.nome} corBg={c.corBg} corFg={c.corFg} size="md" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum conjunto atribuído.</p>
                )}
              </div>

              <div className="glass-card rounded-2xl border border-border p-6">
                <p className="eyebrow mb-4">Observações</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {figure.observacoes || "Sem observações."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
