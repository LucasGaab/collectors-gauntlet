"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { FigureRow, OptionColorMap } from "@/components/FigureTable";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

const FALLBACK = { corBg: "#EFEFEF", corFg: "#3D3D3D" };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const LINHAS: { chave: keyof FigureRow | "marca" | "grupo"; rotulo: string }[] = [
  { chave: "personagem", rotulo: "Personagem" },
  { chave: "marca", rotulo: "Marca" },
  { chave: "grupo", rotulo: "Grupo" },
  { chave: "linha", rotulo: "Linha" },
  { chave: "escala", rotulo: "Escala" },
  { chave: "estilo", rotulo: "Estilo" },
  { chave: "alinhamento", rotulo: "Alinhamento" },
  { chave: "tipo", rotulo: "Tipo" },
  { chave: "status", rotulo: "Status" },
  { chave: "faixaPreco", rotulo: "Faixa" },
];

/** Categorias que têm cor cadastrada e por isso viram badge. */
const COM_COR = new Set(["escala", "estilo", "alinhamento", "tipo", "status", "faixaPreco"]);

export function CompararModal({
  pecas,
  optionColors,
  aoFechar,
}: {
  pecas: FigureRow[];
  optionColors: OptionColorMap;
  aoFechar: () => void;
}) {
  const corDe = (cat: string, valor: string) => optionColors[cat]?.[valor] ?? FALLBACK;

  // Um valor que difere entre as peças é destacado — é o ponto da comparação.
  function difere(chave: string) {
    const vals = pecas.map((p) => textoDe(p, chave));
    return new Set(vals).size > 1;
  }

  function textoDe(p: FigureRow, chave: string): string {
    if (chave === "marca") return p.marca.nome;
    if (chave === "grupo") return p.grupo.nome;
    const v = (p as unknown as Record<string, unknown>)[chave];
    return v == null || v === "" ? "—" : String(v);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
      className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/75 p-3 py-8 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="display-title text-lg">Comparar {pecas.length} peças</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar comparação"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-5">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${pecas.length}, minmax(0, 1fr))` }}
          >
            {pecas.map((p) => (
              <div key={p.id} className="min-w-0">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background">
                  {p.thumbUrl ?? p.imagemUrl ? (
                    <Image
                      src={(p.thumbUrl ?? p.imagemUrl)!}
                      alt={p.nome}
                      fill
                      sizes="30vw"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
                <p className="display-title mt-2 truncate text-sm" title={p.nome}>
                  {p.nome}
                </p>
                <p className="display-title text-lg text-gold">
                  {p.precoEstimado != null ? brl(p.precoEstimado) : "—"}
                </p>
              </div>
            ))}
          </div>

          <dl className="mt-6 space-y-1">
            {LINHAS.map(({ chave, rotulo }) => {
              const destacar = difere(chave as string);
              return (
                <div
                  key={chave as string}
                  className={`rounded-lg px-3 py-2 ${destacar ? "bg-primary/10" : ""}`}
                >
                  <dt className="eyebrow mb-2">{rotulo}</dt>
                  <dd
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${pecas.length}, minmax(0, 1fr))` }}
                  >
                    {pecas.map((p) => {
                      const texto = textoDe(p, chave as string);
                      const k = chave as string;
                      return (
                        <span key={p.id} className="min-w-0 text-sm">
                          {k === "marca" ? (
                            <Badge label={p.marca.nome} corBg={p.marca.corBg} corFg={p.marca.corFg} />
                          ) : k === "grupo" ? (
                            <Badge label={p.grupo.nome} corBg={p.grupo.corBg} corFg={p.grupo.corFg} />
                          ) : COM_COR.has(k) && texto !== "—" ? (
                            <Badge label={texto} {...corDe(k, texto)} />
                          ) : (
                            <span className="block truncate text-muted-foreground">{texto}</span>
                          )}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            Linhas destacadas são onde as peças diferem.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
