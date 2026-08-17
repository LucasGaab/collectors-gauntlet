import { prisma } from "@/lib/prisma";
import { NOT_DELETED, WISHLIST_STATUSES } from "@/lib/queries";
import { mediaFicha } from "@/lib/ficha";

/**
 * Leituras derivadas do acervo — pódio, preços defasados, multiverso, orçamento.
 * Nenhuma delas grava nada, e todas respeitam a lixeira (NOT_DELETED) e a regra
 * dinâmica de wishlist (WISHLIST_STATUSES), nunca nomes de status fixos.
 *
 * Os cálculos rodam em memória de propósito: uma coleção pessoal cabe numa
 * consulta só, e ranquear por média da Ficha de Poder ou por tempo de caçada
 * exigiria SQL cru — que voltaria a acoplar o código aos nomes das colunas.
 */

const DIA_MS = 86_400_000;

const SELECAO_PECA = {
  id: true,
  nome: true,
  personagem: true,
  linha: true,
  status: true,
  thumbUrl: true,
  imagemUrl: true,
  precoEstimado: true,
  precoConferidoEm: true,
  conquistadaEm: true,
  prioridade: true,
  era: true,
  createdAt: true,
  articulacao: true,
  pintura: true,
  acessorios: true,
  semelhanca: true,
  raridade: true,
  marca: { select: { nome: true, corBg: true, corFg: true } },
  grupo: { select: { nome: true, corBg: true, corFg: true } },
} as const;

export type Peca = Awaited<ReturnType<typeof carregarPecas>>[number];

async function carregarPecas() {
  return prisma.figure.findMany({ where: NOT_DELETED, select: SELECAO_PECA });
}

const ehWishlist = (status: string) => WISHLIST_STATUSES.includes(status);

/** Quando a peça passou a ser sua. Sem conquista registrada, vale o cadastro. */
export function entrouNaColecaoEm(p: { conquistadaEm: Date | null; createdAt: Date }): Date {
  return p.conquistadaEm ?? p.createdAt;
}

// ---------------------------------------------------------------- item 19

/** Uma conferência de preço "vence" depois disso. */
export const MESES_ATE_DEFASAR = 6;

export type PrecoDefasado = {
  id: string;
  nome: string;
  personagem: string;
  status: string;
  thumbUrl: string | null;
  precoEstimado: number | null;
  precoConferidoEm: Date | null;
  /** Dias desde a última conferência; null quando nunca foi conferida. */
  diasSemConferir: number | null;
  marca: { nome: string; corBg: string; corFg: string };
};

/**
 * Peças cujo preço está velho: nunca conferido, ou conferido há mais de
 * `meses`. As nunca conferidas vêm primeiro — são as mais desatualizadas que
 * existem, ainda que não tenham data pra comparar.
 */
export async function getPrecosDefasados(meses = MESES_ATE_DEFASAR): Promise<PrecoDefasado[]> {
  const corte = new Date(Date.now() - meses * 30 * DIA_MS);

  const pecas = await prisma.figure.findMany({
    where: {
      ...NOT_DELETED,
      OR: [{ precoConferidoEm: null }, { precoConferidoEm: { lt: corte } }],
    },
    orderBy: [{ precoConferidoEm: { sort: "asc", nulls: "first" } }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      personagem: true,
      status: true,
      thumbUrl: true,
      precoEstimado: true,
      precoConferidoEm: true,
      marca: { select: { nome: true, corBg: true, corFg: true } },
    },
  });

  return pecas.map((p) => ({
    ...p,
    diasSemConferir: p.precoConferidoEm
      ? Math.floor((Date.now() - p.precoConferidoEm.getTime()) / DIA_MS)
      : null,
  }));
}

/** Só a contagem, para o KPI do dashboard não pagar a lista inteira. */
export async function contarPrecosDefasados(meses = MESES_ATE_DEFASAR): Promise<number> {
  const corte = new Date(Date.now() - meses * 30 * DIA_MS);
  return prisma.figure.count({
    where: {
      ...NOT_DELETED,
      OR: [{ precoConferidoEm: null }, { precoConferidoEm: { lt: corte } }],
    },
  });
}

// ---------------------------------------------------------------- item 20

export type VersaoPersonagem = {
  id: string;
  nome: string;
  linha: string | null;
  status: string;
  thumbUrl: string | null;
  precoEstimado: number | null;
  era: string | null;
  marca: { nome: string; corBg: string; corFg: string };
};

/** Chave de agrupamento do multiverso: personagem sem caixa nem espaço sobrando. */
export function chavePersonagem(personagem: string): string {
  return personagem.trim().toLocaleLowerCase("pt-BR");
}

/** Todas as suas versões de um personagem, na ordem em que entraram. */
export async function getVersoesDoPersonagem(personagem: string): Promise<VersaoPersonagem[]> {
  const alvo = personagem.trim();
  if (alvo === "") return [];

  const pecas = await prisma.figure.findMany({
    where: { ...NOT_DELETED, personagem: { equals: alvo, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nome: true,
      linha: true,
      status: true,
      thumbUrl: true,
      precoEstimado: true,
      era: true,
      marca: { select: { nome: true, corBg: true, corFg: true } },
    },
  });

  return pecas;
}

export type PersonagemMultiverso = {
  personagem: string;
  versoes: number;
  /** Marcas distintas em que você tem esse personagem. */
  marcas: string[];
  capaUrl: string | null;
  valor: number;
};

/**
 * Personagens com mais de uma versão no acervo — o índice do multiverso.
 * Agrupa sem diferenciar maiúsculas/acentuação de espaço, e exibe a grafia
 * mais frequente.
 */
export async function getMultiverso(): Promise<PersonagemMultiverso[]> {
  const pecas = await prisma.figure.findMany({
    where: NOT_DELETED,
    orderBy: { createdAt: "asc" },
    select: {
      personagem: true,
      thumbUrl: true,
      precoEstimado: true,
      marca: { select: { nome: true } },
    },
  });

  const grupos = new Map<
    string,
    { grafias: Map<string, number>; marcas: Set<string>; capaUrl: string | null; valor: number; versoes: number }
  >();

  for (const p of pecas) {
    const nome = p.personagem.trim();
    if (nome === "") continue;
    const chave = chavePersonagem(nome);
    const atual = grupos.get(chave) ?? {
      grafias: new Map<string, number>(),
      marcas: new Set<string>(),
      capaUrl: null,
      valor: 0,
      versoes: 0,
    };
    atual.grafias.set(nome, (atual.grafias.get(nome) ?? 0) + 1);
    atual.marcas.add(p.marca.nome);
    atual.capaUrl ??= p.thumbUrl;
    atual.valor += p.precoEstimado ?? 0;
    atual.versoes += 1;
    grupos.set(chave, atual);
  }

  return [...grupos.values()]
    .filter((g) => g.versoes > 1)
    .map((g) => ({
      personagem: [...g.grafias.entries()].sort((a, b) => b[1] - a[1])[0][0],
      versoes: g.versoes,
      marcas: [...g.marcas].sort(),
      capaUrl: g.capaUrl,
      valor: g.valor,
    }))
    .sort((a, b) => b.versoes - a.versoes || a.personagem.localeCompare(b.personagem, "pt-BR"));
}

// ---------------------------------------------------------------- item 13

export type ItemPodio = {
  id: string;
  nome: string;
  personagem: string;
  thumbUrl: string | null;
  /** Valor já formatado do critério — cada ranking mede uma coisa diferente. */
  destaque: string;
  marca: { nome: string; corBg: string; corFg: string };
};

export type Ranking = {
  chave: string;
  titulo: string;
  descricao: string;
  itens: ItemPodio[];
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function emMeses(dias: number): string {
  if (dias < 1) return "menos de um dia";
  if (dias < 30) return `${dias} dia${dias === 1 ? "" : "s"}`;
  const meses = Math.round(dias / 30);
  if (meses < 18) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = (meses / 12).toFixed(1).replace(".", ",");
  return `${anos} anos`;
}

/** Monta um ranking a partir de um critério numérico; ignora quem não pontua. */
function ranquear(
  pecas: Peca[],
  criterio: (p: Peca) => number | null,
  formatar: (valor: number, p: Peca) => string,
  limite = 3,
): ItemPodio[] {
  return pecas
    .map((p) => ({ p, valor: criterio(p) }))
    .filter((x): x is { p: Peca; valor: number } => x.valor != null)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite)
    .map(({ p, valor }) => ({
      id: p.id,
      nome: p.nome,
      personagem: p.personagem,
      thumbUrl: p.thumbUrl,
      destaque: formatar(valor, p),
      marca: p.marca,
    }));
}

/**
 * Rankings automáticos da coleção (item 13). A wishlist fica de fora: pódio é
 * do que já é seu — exceto o de caçada, que só existe por causa dela.
 */
export async function getPodio(): Promise<Ranking[]> {
  const todas = await carregarPecas();
  const colecao = todas.filter((p) => !ehWishlist(p.status));
  const agora = Date.now();

  const media = (p: Peca) =>
    mediaFicha({
      articulacao: p.articulacao,
      pintura: p.pintura,
      acessorios: p.acessorios,
      semelhanca: p.semelhanca,
      raridade: p.raridade,
    });

  return [
    {
      chave: "caras",
      titulo: "As mais caras",
      descricao: "Pelo preço estimado que você registrou.",
      itens: ranquear(colecao, (p) => p.precoEstimado, (v) => brl(v)),
    },
    {
      chave: "veteranas",
      titulo: "Veteranas da estante",
      descricao: "Há mais tempo na coleção, contando da conquista.",
      itens: ranquear(
        colecao,
        (p) => agora - entrouNaColecaoEm(p).getTime(),
        (v) => `${emMeses(Math.floor(v / DIA_MS))} na estante`,
      ),
    },
    {
      chave: "cacadas",
      titulo: "As mais caçadas",
      descricao: "Maior espera entre entrar na wishlist e virar sua.",
      itens: ranquear(
        colecao,
        (p) => (p.conquistadaEm ? p.conquistadaEm.getTime() - p.createdAt.getTime() : null),
        (v) => `caçada por ${emMeses(Math.max(0, Math.floor(v / DIA_MS)))}`,
      ),
    },
    {
      chave: "notas",
      titulo: "Melhores notas",
      descricao: "Maior média na Ficha de Poder.",
      itens: ranquear(colecao, media, (v) => `${v.toFixed(1)} de 7`),
    },
    {
      chave: "custo",
      titulo: "Melhor custo-benefício",
      descricao: "Nota da Ficha de Poder por cada R$ 100 pagos.",
      itens: ranquear(
        colecao,
        (p) => {
          const m = media(p);
          if (m == null || !p.precoEstimado || p.precoEstimado <= 0) return null;
          return (m / p.precoEstimado) * 100;
        },
        (v, p) => `${v.toFixed(2)} pts / R$ 100 · ${brl(p.precoEstimado ?? 0)}`,
      ),
    },
  ].filter((r) => r.itens.length > 0);
}

// ---------------------------------------------------------------- item 16

export type SugestaoCompra = {
  id: string;
  nome: string;
  personagem: string;
  preco: number;
  prioridade: string | null;
};

export type Orcamento = {
  teto: number;
  /** Soma do que entrou na coleção no mês corrente. */
  gastoNoMes: number;
  restante: number;
  /** Meses de orçamento que a wishlist inteira consumiria. */
  mesesDeWishlist: number | null;
  valorWishlist: number;
  /** A peça mais cobiçada que ainda cabe no que sobrou do mês. */
  proximaCompra: SugestaoCompra | null;
};

const PESO_PRIORIDADE: Record<string, number> = { alta: 3, media: 2, baixa: 1 };

/**
 * Leitura do orçamento mensal (item 16). Devolve null quando não há teto
 * definido em Preferências — o painel simplesmente não aparece.
 */
export async function getOrcamento(teto: number | null): Promise<Orcamento | null> {
  if (!teto || teto <= 0) return null;

  const pecas = await carregarPecas();
  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const gastoNoMes = pecas
    .filter((p) => !ehWishlist(p.status) && entrouNaColecaoEm(p) >= inicioDoMes)
    .reduce((s, p) => s + (p.precoEstimado ?? 0), 0);

  const wishlist = pecas.filter((p) => ehWishlist(p.status));
  const valorWishlist = wishlist.reduce((s, p) => s + (p.precoEstimado ?? 0), 0);
  const restante = Math.max(0, teto - gastoNoMes);

  // Mais cobiçada primeiro; empatou, a mais cara que ainda cabe — aproveita
  // melhor o que sobrou do mês do que levar a barata primeiro.
  const proxima = wishlist
    .filter((p) => p.precoEstimado != null && p.precoEstimado > 0 && p.precoEstimado <= restante)
    .sort(
      (a, b) =>
        (PESO_PRIORIDADE[b.prioridade ?? ""] ?? 0) - (PESO_PRIORIDADE[a.prioridade ?? ""] ?? 0) ||
        (b.precoEstimado ?? 0) - (a.precoEstimado ?? 0),
    )[0];

  return {
    teto,
    gastoNoMes,
    restante,
    valorWishlist,
    mesesDeWishlist: valorWishlist > 0 ? valorWishlist / teto : null,
    proximaCompra: proxima
      ? {
          id: proxima.id,
          nome: proxima.nome,
          personagem: proxima.personagem,
          preco: proxima.precoEstimado ?? 0,
          prioridade: proxima.prioridade,
        }
      : null,
  };
}

// ---------------------------------------------------------------- item 21

/** Ordem cronológica das eras — a mesma do <select> do formulário. */
export const ERAS = ["Ouro", "Prata", "Bronze", "Moderna"] as const;

export const COR_ERA: Record<string, string> = {
  Ouro: "#E8C468",
  Prata: "#C7C9D1",
  Bronze: "#C9803A",
  Moderna: "#ED1D24",
  "Sem era": "#3F3F49",
};

export type DistribuicaoEra = { name: string; value: number; corBg: string };

/**
 * Distribuição por era da HQ (item 21). Mantém a ordem cronológica em vez de
 * ordenar por quantidade — a leitura interessante é a curva do gosto, não o
 * ranking. "Sem era" só aparece quando existe.
 */
export function distribuicaoPorEra(
  pecas: { era: string | null }[],
): DistribuicaoEra[] {
  const contagem = new Map<string, number>();
  for (const p of pecas) {
    const chave = p.era && ERAS.includes(p.era as (typeof ERAS)[number]) ? p.era : "Sem era";
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  return [...ERAS, "Sem era"]
    .filter((era) => contagem.has(era))
    .map((era) => ({ name: era, value: contagem.get(era) ?? 0, corBg: COR_ERA[era] }));
}
