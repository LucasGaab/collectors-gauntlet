/**
 * Ficha de Poder no formato dos handbooks antigos: cinco atributos numa escala
 * de 1 a 7. Nulo significa "não avaliado" e não conta em média nem ranking.
 *
 * Mora aqui, e não em components/FichaPoder.tsx, porque o pódio e os rankings
 * rodam no servidor — e todo export de um módulo "use client" vira referência
 * de cliente, impossível de chamar durante o render de servidor.
 */

export const ATRIBUTOS = [
  { chave: "articulacao", rotulo: "Articulação" },
  { chave: "pintura", rotulo: "Pintura" },
  { chave: "acessorios", rotulo: "Acessórios" },
  { chave: "semelhanca", rotulo: "Semelhança" },
  { chave: "raridade", rotulo: "Raridade" },
] as const;

export type AtributoChave = (typeof ATRIBUTOS)[number]["chave"];
export type NotasFicha = Partial<Record<AtributoChave, number | null>>;

export const NOTA_MAX = 7;

/** Média das notas preenchidas; null quando nada foi avaliado. */
export function mediaFicha(notas: NotasFicha): number | null {
  const vals = ATRIBUTOS.map((a) => notas[a.chave]).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
