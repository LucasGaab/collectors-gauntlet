import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FigureSearchParams = {
  q?: string;
  marca?: string;
  grupo?: string;
  conjunto?: string;
  escala?: string;
  estilo?: string;
  alinhamento?: string;
  tipo?: string;
  status?: string;
  faixaPreco?: string;
  sort?: string;
  dir?: string;
  view?: string;
};

const SORTABLE_FIELDS = new Set([
  "nome",
  "personagem",
  "marca",
  "grupo",
  "escala",
  "estilo",
  "alinhamento",
  "tipo",
  "status",
  "faixaPreco",
  "precoEstimado",
  "createdAt",
]);

function csv(value?: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

/**
 * scopeStatuses trava o resultado a um subconjunto de status (usado para
 * separar Coleção de Wishlist) — o filtro de status do usuário, quando
 * presente, já vem restrito a esse mesmo subconjunto pela UI.
 */
export function buildFigureWhere(
  params: FigureSearchParams,
  scopeStatuses?: string[],
): Prisma.FigureWhereInput {
  const where: Prisma.FigureWhereInput = { deletedAt: null };

  const marcaIds = csv(params.marca);
  const grupoIds = csv(params.grupo);
  const conjuntoIds = csv(params.conjunto);
  const escalas = csv(params.escala);
  const estilos = csv(params.estilo);
  const alinhamentos = csv(params.alinhamento);
  const tipos = csv(params.tipo);
  const statuses = csv(params.status);
  const faixasPreco = csv(params.faixaPreco);

  if (marcaIds.length) where.marcaId = { in: marcaIds };
  if (grupoIds.length) where.grupoId = { in: grupoIds };
  if (conjuntoIds.length) where.conjuntos = { some: { id: { in: conjuntoIds } } };
  if (escalas.length) where.escala = { in: escalas };
  if (estilos.length) where.estilo = { in: estilos };
  if (alinhamentos.length) where.alinhamento = { in: alinhamentos };
  if (tipos.length) where.tipo = { in: tipos };
  if (faixasPreco.length) where.faixaPreco = { in: faixasPreco };

  if (statuses.length) where.status = { in: statuses };
  else if (scopeStatuses) where.status = { in: scopeStatuses };

  if (params.q && params.q.trim() !== "") {
    const q = params.q.trim();
    where.OR = [
      { nome: { contains: q } },
      { personagem: { contains: q } },
      { linha: { contains: q } },
    ];
  }

  return where;
}

export function buildFigureOrderBy(
  params: FigureSearchParams,
): Prisma.FigureOrderByWithRelationInput {
  const sort = params.sort && SORTABLE_FIELDS.has(params.sort) ? params.sort : "createdAt";
  const dir = params.dir === "asc" ? "asc" : "desc";

  if (sort === "marca") return { marca: { nome: dir } };
  if (sort === "grupo") return { grupo: { nome: dir } };
  return { [sort]: dir };
}

export async function getFilterOptions() {
  const [marcas, grupos, conjuntos, options] = await Promise.all([
    prisma.marca.findMany({ orderBy: { ordem: "asc" } }),
    prisma.grupo.findMany({ orderBy: { ordem: "asc" } }),
    prisma.conjunto.findMany({ orderBy: { ordem: "asc" } }),
    prisma.option.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  const byCategoria = (categoria: string) => options.filter((o) => o.categoria === categoria);

  return {
    marcas,
    grupos,
    conjuntos,
    escalas: byCategoria("escala"),
    estilos: byCategoria("estilo"),
    alinhamentos: byCategoria("alinhamento"),
    tipos: byCategoria("tipo"),
    statuses: byCategoria("status"),
    faixasPreco: byCategoria("faixaPreco"),
    allOptions: options,
  };
}

export type MetaProgresso = {
  id: string;
  nome: string;
  corBg: string;
  corFg: string;
  /** Peças que você já tem (qualquer status que não seja wishlist). */
  tenho: number;
  /** Ainda na wishlist dentro deste grupo/conjunto. */
  faltamCatalogadas: number;
  /** Alvo: a meta manual, ou o total já catalogado quando não há meta. */
  alvo: number;
  /** Se veio de meta manual (aí o alvo pode ser maior que o catalogado). */
  metaManual: boolean;
};

function montarProgresso(
  base: { id: string; nome: string; corBg: string; corFg: string; meta: number | null },
  statuses: string[],
): MetaProgresso {
  const total = statuses.length;
  const tenho = statuses.filter((s) => !WISHLIST_STATUSES.includes(s)).length;
  const alvo = base.meta && base.meta > 0 ? base.meta : total;
  return {
    id: base.id,
    nome: base.nome,
    corBg: base.corBg,
    corFg: base.corFg,
    tenho,
    faltamCatalogadas: total - tenho,
    alvo: Math.max(alvo, tenho),
    metaManual: Boolean(base.meta && base.meta > 0),
  };
}

/**
 * Progresso de coleção por Grupo e por Conjunto: quantas peças você já tem
 * contra o alvo. Itens na lixeira ficam de fora.
 */
export async function getMetas(): Promise<{ grupos: MetaProgresso[]; conjuntos: MetaProgresso[] }> {
  const [grupos, conjuntos] = await Promise.all([
    prisma.grupo.findMany({
      orderBy: { ordem: "asc" },
      include: { figures: { where: NOT_DELETED, select: { status: true } } },
    }),
    prisma.conjunto.findMany({
      orderBy: { ordem: "asc" },
      include: { figures: { where: NOT_DELETED, select: { status: true } } },
    }),
  ]);

  const mapear = (lista: typeof grupos | typeof conjuntos) =>
    lista
      .map((item) => montarProgresso(item, item.figures.map((f) => f.status)))
      .filter((p) => p.alvo > 0);

  return { grupos: mapear(grupos), conjuntos: mapear(conjuntos) };
}

export function buildOptionColorMap(options: { categoria: string; valor: string; corBg: string; corFg: string }[]) {
  const map: Record<string, Record<string, { corBg: string; corFg: string }>> = {};
  for (const o of options) {
    map[o.categoria] ??= {};
    map[o.categoria][o.valor] = { corBg: o.corBg, corFg: o.corFg };
  }
  return map;
}

/**
 * Filtro base de toda leitura de figuras: itens na lixeira (soft delete) nunca
 * aparecem em listagens, dashboard ou detalhe.
 */
export const NOT_DELETED = { deletedAt: null } satisfies Prisma.FigureWhereInput;

export const WISHLIST_STATUSES = ["Lista de Desejos"];

/**
 * "Coleção" = qualquer status cadastrado em Listas Auxiliares que não seja
 * "Lista de Desejos". Calculado dinamicamente (em vez de uma lista fixa) pra
 * respeitar customizações feitas pelo usuário na tela de Listas Auxiliares.
 */
export async function getCollectionStatuses(): Promise<string[]> {
  const statuses = await prisma.option.findMany({ where: { categoria: "status" } });
  return statuses.map((s) => s.valor).filter((v) => !WISHLIST_STATUSES.includes(v));
}
