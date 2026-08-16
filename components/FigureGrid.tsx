"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import type { Figure, Marca, Grupo } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { DeleteFigureButton } from "@/components/DeleteFigureButton";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import type { OptionColorMap } from "@/components/FigureTable";
import { Stagger, StaggerItem } from "@/components/motion";

type FigureCard = Figure & { marca: Marca; grupo: Grupo };

const FALLBACK_COLOR = { corBg: "#EFEFEF", corFg: "#3D3D3D" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FigureGrid({
  figures,
  optionColors,
  selected,
  onToggle,
}: {
  figures: FigureCard[];
  optionColors: OptionColorMap;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const colorFor = (categoria: string, valor: string) =>
    optionColors[categoria]?.[valor] ?? FALLBACK_COLOR;

  return (
    <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {figures.map((f) => {
        const isSelected = selected.includes(f.id);
        return (
        <StaggerItem key={f.id} className="group relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-b from-primary/25 to-transparent opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
          <div className={`relative overflow-hidden rounded-xl border bg-surface transition-transform duration-300 group-hover:-translate-y-1 ${
            isSelected ? "border-primary" : "border-border"
          }`}>
            <div className="relative aspect-square w-full">
              <Link href={`/figuras/${f.id}`} aria-label={`Ver ${f.nome}`} className="absolute inset-0 z-0">
                {f.thumbUrl ?? f.imagemUrl ? (
                  <Image
                    src={(f.thumbUrl ?? f.imagemUrl)!}
                    alt={f.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    className="object-cover"
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </Link>
              <div className="pointer-events-none absolute left-2 bottom-2 z-10 flex flex-wrap gap-1">
                <Badge label={f.status} {...colorFor("status", f.status)} />
              </div>
              <label
                className={`absolute left-2 top-2 z-20 grid size-7 cursor-pointer place-items-center rounded-full bg-background/80 backdrop-blur transition-opacity duration-150 ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(f.id)}
                  aria-label={`Selecionar ${f.nome}`}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <Link
                  href={`/figuras/${f.id}?edit=1`}
                  aria-label={`Editar ${f.nome}`}
                  className="grid size-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:text-primary"
                >
                  <Pencil size={12} />
                </Link>
                <DeleteFigureButton id={f.id} nome={f.nome} variant="icon" />
              </div>
            </div>
            <Link href={`/figuras/${f.id}`} className="block p-3">
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {f.marca.nome} • {f.linha || "—"}
              </p>
              <h3 className="display-title mt-1 truncate text-sm leading-tight transition-colors group-hover:text-primary">
                {f.nome}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Badge label={f.grupo.nome} corBg={f.grupo.corBg} corFg={f.grupo.corFg} />
                {f.precoEstimado != null && (
                  <span className="display-title shrink-0 text-sm text-gold">
                    {brl(f.precoEstimado)}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </StaggerItem>
        );
      })}
    </Stagger>
  );
}
