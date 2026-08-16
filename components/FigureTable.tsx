"use client";

import Link from "next/link";
import Image from "next/image";
import type { Figure, Marca, Grupo } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { DeleteFigureButton } from "@/components/DeleteFigureButton";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export type FigureRow = Figure & { marca: Marca; grupo: Grupo };

export type OptionColorMap = Record<string, Record<string, { corBg: string; corFg: string }>>;

const FALLBACK_COLOR = { corBg: "#EFEFEF", corFg: "#3D3D3D" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLUMNS: { key: string; label: string }[] = [
  { key: "nome", label: "Peça" },
  { key: "personagem", label: "Personagem" },
  { key: "marca", label: "Marca" },
  { key: "grupo", label: "Grupo" },
  { key: "escala", label: "Escala" },
  { key: "estilo", label: "Estilo" },
  { key: "alinhamento", label: "Alinhamento" },
  { key: "tipo", label: "Tipo" },
  { key: "status", label: "Status" },
  { key: "precoEstimado", label: "Preço" },
  { key: "faixaPreco", label: "Faixa" },
];

function SortableHeader({
  column,
  currentParams,
}: {
  column: { key: string; label: string };
  currentParams: URLSearchParams;
}) {
  const params = new URLSearchParams(currentParams);
  const currentSort = params.get("sort") ?? "createdAt";
  const currentDir = params.get("dir") ?? "desc";
  const isActive = currentSort === column.key;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  params.set("sort", column.key);
  params.set("dir", nextDir);

  return (
    <Link
      href={`?${params.toString()}`}
      scroll={false}
      className={`text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-foreground ${
        isActive ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {column.label} {isActive ? (currentDir === "asc" ? "↑" : "↓") : ""}
    </Link>
  );
}

export function FigureTable({
  figures,
  searchParamsString,
  optionColors,
  selected,
  onToggle,
  onToggleAll,
}: {
  figures: FigureRow[];
  searchParamsString: string;
  optionColors: OptionColorMap;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const currentParams = new URLSearchParams(searchParamsString);
  const allSelected = figures.length > 0 && selected.length === figures.length;
  const colorFor = (categoria: string, valor: string) =>
    optionColors[categoria]?.[valor] ?? FALLBACK_COLOR;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10 px-3 py-4 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Selecionar todas as peças"
                className="size-4 accent-[var(--primary)]"
              />
            </th>
            <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Foto
            </th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-5 py-4 text-left">
                <SortableHeader column={col} currentParams={currentParams} />
              </th>
            ))}
            <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {figures.map((f) => (
            <tr
              key={f.id}
              className={`border-b border-border/60 transition-colors hover:bg-foreground/5 ${
                selected.includes(f.id) ? "bg-primary/10" : ""
              }`}
            >
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.includes(f.id)}
                  onChange={() => onToggle(f.id)}
                  aria-label={`Selecionar ${f.nome}`}
                  className="size-4 accent-[var(--primary)]"
                />
              </td>
              <td className="px-5 py-3">
                <Link
                  href={`/figuras/${f.id}`}
                  aria-label={`Ver ${f.nome}`}
                  className="relative block h-10 w-10 overflow-hidden rounded-lg"
                >
                  {f.thumbUrl ?? f.imagemUrl ? (
                    <Image
                      src={(f.thumbUrl ?? f.imagemUrl)!}
                      alt={f.nome}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder compact />
                  )}
                </Link>
              </td>
              <td className="px-5 py-3">
                <Link href={`/figuras/${f.id}`} className="font-semibold hover:text-primary">
                  {f.nome}
                </Link>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{f.personagem}</td>
              <td className="px-5 py-3">
                <Badge label={f.marca.nome} corBg={f.marca.corBg} corFg={f.marca.corFg} />
              </td>
              <td className="px-5 py-3">
                <Badge label={f.grupo.nome} corBg={f.grupo.corBg} corFg={f.grupo.corFg} />
              </td>
              <td className="px-5 py-3 text-muted-foreground">{f.escala}</td>
              <td className="px-5 py-3 text-muted-foreground">{f.estilo}</td>
              <td className="px-5 py-3">
                <Badge label={f.alinhamento} {...colorFor("alinhamento", f.alinhamento)} />
              </td>
              <td className="px-5 py-3">
                <Badge label={f.tipo} {...colorFor("tipo", f.tipo)} />
              </td>
              <td className="px-5 py-3">
                <Badge label={f.status} {...colorFor("status", f.status)} />
              </td>
              <td className="px-5 py-3 font-semibold text-gold">
                {f.precoEstimado != null ? brl(f.precoEstimado) : "—"}
              </td>
              <td className="px-5 py-3">
                <Badge label={f.faixaPreco} {...colorFor("faixaPreco", f.faixaPreco)} />
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/figuras/${f.id}?edit=1`}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <DeleteFigureButton id={f.id} nome={f.nome} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
