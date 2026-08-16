import { prisma } from "@/lib/prisma";

/** App single-user: a configuração vive numa linha só, com id fixo. */
export const PREFS_ID = "singleton";

export const TEMAS = [
  { id: "obsidian", nome: "Obsidian", desc: "O original: chumbo, vermelho e ouro" },
  { id: "cosmico", nome: "Cósmico", desc: "Roxo profundo e dourado" },
  { id: "simbionte", nome: "Simbionte", desc: "Preto e branco, sem cor" },
  { id: "gama", nome: "Gama", desc: "Verde ácido e roxo" },
  { id: "asgard", nome: "Asgard", desc: "Azul profundo e ouro" },
  { id: "noir", nome: "Noir", desc: "Cinza e um único vermelho" },
] as const;

export type TemaId = (typeof TEMAS)[number]["id"];

export type Preferencias = {
  nomeColecao: string | null;
  tema: string;
  densidade: number;
  orcamentoMensal: number | null;
  graoPapel: boolean;
  somAmbiente: boolean;
};

const PADRAO: Preferencias = {
  nomeColecao: null,
  tema: "obsidian",
  densidade: 5,
  orcamentoMensal: null,
  graoPapel: false,
  somAmbiente: false,
};

/**
 * Lê as preferências, criando a linha na primeira vez. Nunca lança: se o banco
 * estiver indisponível o app volta ao padrão em vez de quebrar a página toda.
 */
export async function getPreferencias(): Promise<Preferencias> {
  try {
    const p = await prisma.preferencias.upsert({
      where: { id: PREFS_ID },
      update: {},
      create: { id: PREFS_ID },
    });
    return {
      nomeColecao: p.nomeColecao,
      tema: p.tema,
      densidade: p.densidade,
      orcamentoMensal: p.orcamentoMensal,
      graoPapel: p.graoPapel,
      somAmbiente: p.somAmbiente,
    };
  } catch {
    return PADRAO;
  }
}

/** Classe de grid do catálogo derivada da densidade escolhida (3 a 7 colunas). */
export function classeDensidade(densidade: number): string {
  const mapa: Record<number, string> = {
    3: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6",
    7: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-7",
  };
  return mapa[densidade] ?? mapa[5];
}
