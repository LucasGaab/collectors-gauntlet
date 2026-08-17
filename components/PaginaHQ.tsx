"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Figure, Marca, Grupo } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { SeloRaridade } from "@/components/SeloRaridade";
import type { OptionColorMap } from "@/components/FigureTable";

type Peca = Figure & { marca: Marca; grupo: Grupo };

const FALLBACK = { corBg: "#EFEFEF", corFg: "#3D3D3D" };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Peso do painel numa página de quadrinho: as peças de maior destaque ganham
 * quadro maior, como o "splash panel". O destaque é objetivo — preço e nota de
 * raridade — em vez de aleatório, pra que a página fique estável entre renders.
 */
function pesoDe(p: Peca, precoMaximo: number): number {
  const porPreco = precoMaximo > 0 ? (p.precoEstimado ?? 0) / precoMaximo : 0;
  const porRaridade = (p.raridade ?? 0) / 7;
  return porPreco * 0.6 + porRaridade * 0.4;
}

/** Vão do painel na grade de 6 colunas, do maior destaque para o menor. */
function spanDe(indiceDestaque: number): string {
  if (indiceDestaque === 0) return "col-span-4 row-span-2 sm:col-span-3";
  if (indiceDestaque < 3) return "col-span-2 row-span-2";
  if (indiceDestaque < 7) return "col-span-2";
  return "col-span-2 sm:col-span-1";
}

export function PaginaHQ({
  figures,
  optionColors,
}: {
  figures: Peca[];
  optionColors: OptionColorMap;
}) {
  const corDe = (cat: string, valor: string) => optionColors[cat]?.[valor] ?? FALLBACK;

  const precoMaximo = Math.max(0, ...figures.map((f) => f.precoEstimado ?? 0));
  // Ranking de destaque: define quem ganha painel grande, sem reordenar a lista.
  const ranking = new Map(
    [...figures]
      .sort((a, b) => pesoDe(b, precoMaximo) - pesoDe(a, precoMaximo))
      .map((f, i) => [f.id, i]),
  );

  return (
    <div className="reticula rounded-2xl border-4 border-black bg-background p-2 sm:p-3">
      {/* grid-flow-dense faz os painéis menores preencherem os buracos que os
          painéis grandes deixam — é o que dá o encaixe de página de HQ. */}
      <div className="grid auto-rows-[minmax(120px,auto)] grid-flow-dense grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {figures.map((f, i) => {
          const destaque = ranking.get(f.id) ?? i;
          const grande = destaque < 3;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, delay: Math.min(i * 0.025, 0.5) }}
              className={`painel-hq cursor-manopla group ${spanDe(destaque)}`}
            >
              <Link href={`/figuras/${f.id}`} className="block h-full">
                <div className="relative h-full min-h-[120px] w-full">
                  {f.thumbUrl ?? f.imagemUrl ? (
                    <Image
                      src={(f.thumbUrl ?? f.imagemUrl)!}
                      alt={f.nome}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}

                  <SeloRaridade raridade={f.raridade} />

                  {/* Caixa de narração: o nome da peça, como legenda do quadro. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 pt-8">
                    <p className="caption-box mb-1 max-w-full truncate">{f.marca.nome}</p>
                    <h3
                      className={`display-title leading-none text-white ${
                        grande ? "text-base sm:text-xl" : "text-[11px] sm:text-sm"
                      }`}
                    >
                      {f.nome}
                    </h3>
                    {grande && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge label={f.status} {...corDe("status", f.status)} />
                        {f.precoEstimado != null && (
                          <span className="display-title text-sm text-gold">
                            {brl(f.precoEstimado)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
