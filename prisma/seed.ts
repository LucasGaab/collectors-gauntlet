import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  MARCA_COLORS,
  GRUPO_COLORS,
  STATUS_COLORS,
  ALINHAMENTO_COLORS,
  TIPO_COLORS,
  FAIXA_PRECO_COLORS,
  ESCALA_COLORS,
  ESTILO_COLORS,
  DEFAULT_OPTION_COLOR,
  type ColorPair,
} from "../lib/colors";

const prisma = new PrismaClient();

type SeedFigure = {
  nome: string;
  personagem: string;
  marca: string;
  linha?: string | null;
  escala: string;
  estilo: string;
  grupo: string;
  alinhamento: string;
  tipo: string;
  status: string;
  preco?: number | null;
  faixaPreco: string;
  observacoes?: string | null;
  link?: string | null;
  imagemUrl?: string | null;
};

function colorFor(map: Record<string, ColorPair>, key: string): ColorPair {
  return map[key] ?? DEFAULT_OPTION_COLOR;
}

async function main() {
  const jsonPath = path.join(process.cwd(), "seed_figures.json");
  const figures: SeedFigure[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  const marcaNomes = [...new Set(figures.map((f) => f.marca))];
  const grupoNomes = [...new Set(figures.map((f) => f.grupo))];
  const escalas = [...new Set(figures.map((f) => f.escala))];
  const estilos = [...new Set(figures.map((f) => f.estilo))];
  const alinhamentos = [...new Set(figures.map((f) => f.alinhamento))];
  const tipos = [...new Set(figures.map((f) => f.tipo))];
  const statuses = [...new Set(figures.map((f) => f.status))];
  const faixasPreco = [...new Set(figures.map((f) => f.faixaPreco))];

  console.log("Seeding marcas...");
  const marcaByNome = new Map<string, string>();
  for (const [i, nome] of marcaNomes.entries()) {
    const { corBg, corFg } = colorFor(MARCA_COLORS, nome);
    const marca = await prisma.marca.upsert({
      where: { nome },
      update: {},
      create: { nome, corBg, corFg, ordem: i },
    });
    marcaByNome.set(nome, marca.id);
  }

  console.log("Seeding grupos...");
  const grupoByNome = new Map<string, string>();
  for (const [i, nome] of grupoNomes.entries()) {
    const { corBg, corFg } = colorFor(GRUPO_COLORS, nome);
    const grupo = await prisma.grupo.upsert({
      where: { nome },
      update: {},
      create: { nome, corBg, corFg, ordem: i },
    });
    grupoByNome.set(nome, grupo.id);
  }

  console.log("Seeding opcoes (escala, estilo, alinhamento, tipo, status, faixaPreco)...");
  const optionGroups: Array<{ categoria: string; valores: string[]; colors: Record<string, ColorPair> }> = [
    { categoria: "escala", valores: escalas, colors: ESCALA_COLORS },
    { categoria: "estilo", valores: estilos, colors: ESTILO_COLORS },
    { categoria: "alinhamento", valores: alinhamentos, colors: ALINHAMENTO_COLORS },
    { categoria: "tipo", valores: tipos, colors: TIPO_COLORS },
    { categoria: "status", valores: statuses, colors: STATUS_COLORS },
    { categoria: "faixaPreco", valores: faixasPreco, colors: FAIXA_PRECO_COLORS },
  ];

  for (const group of optionGroups) {
    for (const [i, valor] of group.valores.entries()) {
      const { corBg, corFg } = colorFor(group.colors, valor);
      await prisma.option.upsert({
        where: { categoria_valor: { categoria: group.categoria, valor } },
        update: {},
        create: { categoria: group.categoria, valor, corBg, corFg, ordem: i },
      });
    }
  }

  console.log("Seeding figuras...");
  await prisma.figure.deleteMany({});
  for (const f of figures) {
    const marcaId = marcaByNome.get(f.marca);
    const grupoId = grupoByNome.get(f.grupo);
    if (!marcaId || !grupoId) {
      console.warn(`Pulando figura sem marca/grupo resolvido: ${f.nome}`);
      continue;
    }
    await prisma.figure.create({
      data: {
        nome: f.nome,
        personagem: f.personagem,
        linha: f.linha ?? null,
        escala: f.escala,
        estilo: f.estilo,
        alinhamento: f.alinhamento,
        tipo: f.tipo,
        status: f.status,
        precoEstimado: f.preco ?? null,
        faixaPreco: f.faixaPreco,
        link: f.link ?? null,
        imagemUrl: f.imagemUrl ?? null,
        observacoes: f.observacoes ?? null,
        marcaId,
        grupoId,
      },
    });
  }

  console.log(`Seed concluido: ${figures.length} figuras.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
