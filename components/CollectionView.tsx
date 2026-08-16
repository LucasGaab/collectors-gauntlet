import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  buildFigureOrderBy,
  buildFigureWhere,
  buildOptionColorMap,
  getFilterOptions,
  type FigureSearchParams,
} from "@/lib/queries";
import { AppShell } from "@/components/AppShell";
import { FilterBar, type FilterGroup } from "@/components/FilterBar";
import { CollectionBody } from "@/components/CollectionBody";
import { ToastFromQuery } from "@/components/ToastFromQuery";
import { EmptyState } from "@/components/EmptyState";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export function normalizeSearchParams(sp: {
  [key: string]: string | string[] | undefined;
}): FigureSearchParams {
  const out: FigureSearchParams = {};
  for (const [key, value] of Object.entries(sp)) {
    out[key as keyof FigureSearchParams] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

export async function CollectionView({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  scopeStatuses,
  showConjuntoFilter,
  params,
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  scopeStatuses: string[];
  showConjuntoFilter: boolean;
  params: FigureSearchParams;
}) {
  const [figures, filterOptions] = await Promise.all([
    prisma.figure.findMany({
      where: buildFigureWhere(params, scopeStatuses),
      orderBy: buildFigureOrderBy(params),
      include: { marca: true, grupo: true },
    }),
    getFilterOptions(),
  ]);

  const optionColors = buildOptionColorMap(filterOptions.allOptions);
  const view = params.view === "grid" ? "grid" : "table";

  const searchParamsString = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  const scopedStatuses = filterOptions.statuses.filter((s) => scopeStatuses.includes(s.valor));

  const hasActiveFilters = Object.entries(params).some(
    ([key, value]) => key !== "view" && key !== "sort" && key !== "dir" && Boolean(value),
  );

  const filterGroups: FilterGroup[] = [
    { key: "marca", label: "Marca", options: filterOptions.marcas },
    { key: "grupo", label: "Grupo", options: filterOptions.grupos },
    ...(showConjuntoFilter
      ? [{ key: "conjunto", label: "Conjunto", options: filterOptions.conjuntos } as FilterGroup]
      : []),
    { key: "escala", label: "Escala", options: filterOptions.escalas, valueKey: "valor" },
    { key: "estilo", label: "Estilo", options: filterOptions.estilos, valueKey: "valor" },
    {
      key: "alinhamento",
      label: "Alinhamento",
      options: filterOptions.alinhamentos,
      valueKey: "valor",
    },
    { key: "tipo", label: "Tipo", options: filterOptions.tipos, valueKey: "valor" },
    ...(scopedStatuses.length > 1
      ? [{ key: "status", label: "Status", options: scopedStatuses, valueKey: "valor" } as FilterGroup]
      : []),
    {
      key: "faixaPreco",
      label: "Faixa de Preço",
      options: filterOptions.faixasPreco,
      valueKey: "valor",
    },
  ];

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={
        <Link
          href="/nova"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary-hover"
        >
          <Plus className="size-4" /> Nova figura
        </Link>
      }
    >
      <ToastFromQuery />
      <KeyboardShortcuts />

      <FilterBar groups={filterGroups} view={view} count={figures.length} />

      {figures.length === 0 ? (
        hasActiveFilters ? (
          // Filtro sem resultado é diferente de coleção vazia: aqui a saída é
          // afrouxar o filtro, não cadastrar peça.
          <EmptyState
            variant="no-results"
            title="Nenhuma peça bate com esses filtros"
            description="Sua coleção tem peças — elas só não passam pelos filtros ou pela busca atual."
            action={
              <a
                href="?"
                className="rounded-full bg-primary px-6 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Limpar filtros
              </a>
            }
          />
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Link
                href="/nova"
                className="rounded-full bg-primary px-6 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Cadastrar primeira peça
              </Link>
            }
          />
        )
      ) : (
        <CollectionBody
          figures={figures}
          view={view}
          optionColors={optionColors}
          searchParamsString={searchParamsString}
          // Todos os status (não só os do escopo atual): mover uma peça da
          // Coleção pra Wishlist — e vice-versa — é uma ação legítima em lote.
          statuses={filterOptions.statuses.map((s) => ({ id: s.id, valor: s.valor }))}
        />
      )}
    </AppShell>
  );
}
