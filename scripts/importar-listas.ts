/**
 * Reimporta as listas auxiliares exportadas por scripts/exportar-listas-sqlite.ts.
 *
 *   npx tsx scripts/importar-listas.ts listas.json
 *
 * Upsert por nome/valor: cria o que falta e corrige cor e ordem do que já existe
 * (a importação de CSV cria valores ausentes com cinza neutro; isto devolve a
 * paleta original). Nenhuma figura é tocada.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Named = { nome: string; corBg: string; corFg: string; ordem: number };
type Opt = { categoria: string; valor: string; corBg: string; corFg: string; ordem: number };

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: npx tsx scripts/importar-listas.ts <listas.json>");
    process.exit(1);
  }

  const dump = JSON.parse(readFileSync(file, "utf-8")) as {
    marcas: Named[];
    grupos: Named[];
    conjuntos: Named[];
    options: Opt[];
  };

  for (const m of dump.marcas) {
    await prisma.marca.upsert({ where: { nome: m.nome }, update: m, create: m });
  }
  for (const g of dump.grupos) {
    await prisma.grupo.upsert({ where: { nome: g.nome }, update: g, create: g });
  }
  for (const c of dump.conjuntos) {
    await prisma.conjunto.upsert({ where: { nome: c.nome }, update: c, create: c });
  }
  for (const o of dump.options) {
    await prisma.option.upsert({
      where: { categoria_valor: { categoria: o.categoria, valor: o.valor } },
      update: o,
      create: o,
    });
  }

  console.log(
    `Listas sincronizadas: ${dump.marcas.length} marcas, ${dump.grupos.length} grupos, ` +
      `${dump.conjuntos.length} conjuntos, ${dump.options.length} opções.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
