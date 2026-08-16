/**
 * Importa um CSV (mesmo formato do export em /listas) direto pelo terminal.
 *
 *   npx tsx scripts/importar-csv.ts caminho/do/backup.csv
 *
 * Útil pra restaurar backup e pra migrar dados entre ambientes sem depender da
 * UI. Mesmas regras da importação da tela: linha com `id` existente atualiza,
 * senão cria; Marca/Grupo/Conjunto e valores de lista que faltarem são criados
 * com cor neutra; URLs de imagem legadas (`/uploads/...`) são descartadas.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { parseCsv, rowsToRecords } from "../lib/csv";

const prisma = new PrismaClient();

const DEFAULT_BG = "#2A2A2E";
const DEFAULT_FG = "#EDEDED";
const OPTION_CATEGORIES = ["escala", "estilo", "alinhamento", "tipo", "status", "faixaPreco"] as const;

function parseNumber(v: string): number | null {
  if (!v) return null;
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function imageUrlOrNull(v: string): string | null {
  const url = (v ?? "").trim();
  if (!url || url.startsWith("/uploads/")) return null;
  return url;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: npx tsx scripts/importar-csv.ts <arquivo.csv>");
    process.exit(1);
  }

  const records = rowsToRecords(parseCsv(readFileSync(file, "utf-8")));
  console.log(`Lendo ${file} — ${records.length} linhas de dados.`);

  const marcaCache = new Map<string, string>();
  const grupoCache = new Map<string, string>();
  const conjuntoCache = new Map<string, string>();
  const knownOptions = new Set(
    (await prisma.option.findMany({ select: { categoria: true, valor: true } })).map(
      (o) => `${o.categoria}::${o.valor}`,
    ),
  );

  async function ensureNamed(
    kind: "marca" | "grupo" | "conjunto",
    nome: string,
    cache: Map<string, string>,
  ): Promise<string> {
    const cached = cache.get(nome);
    if (cached) return cached;

    const data = { nome, corBg: DEFAULT_BG, corFg: DEFAULT_FG };
    let id: string;
    if (kind === "marca") {
      const found = await prisma.marca.findUnique({ where: { nome } });
      if (!found) console.log(`  + criando marca "${nome}" (cor neutra)`);
      id = (found ?? (await prisma.marca.create({ data }))).id;
    } else if (kind === "grupo") {
      const found = await prisma.grupo.findUnique({ where: { nome } });
      if (!found) console.log(`  + criando grupo "${nome}" (cor neutra)`);
      id = (found ?? (await prisma.grupo.create({ data }))).id;
    } else {
      const found = await prisma.conjunto.findUnique({ where: { nome } });
      if (!found) console.log(`  + criando conjunto "${nome}" (cor neutra)`);
      id = (found ?? (await prisma.conjunto.create({ data }))).id;
    }
    cache.set(nome, id);
    return id;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, rec] of records.entries()) {
    const line = index + 2;
    const nome = rec.nome?.trim();
    const personagem = rec.personagem?.trim();

    if (!nome || !personagem || !rec.marca?.trim() || !rec.grupo?.trim()) {
      console.warn(`  ! linha ${line} ignorada: nome/personagem/marca/grupo obrigatórios`);
      skipped++;
      continue;
    }

    const marcaId = await ensureNamed("marca", rec.marca.trim(), marcaCache);
    const grupoId = await ensureNamed("grupo", rec.grupo.trim(), grupoCache);

    for (const cat of OPTION_CATEGORIES) {
      const valor = rec[cat]?.trim();
      if (valor && !knownOptions.has(`${cat}::${valor}`)) {
        await prisma.option.create({
          data: { categoria: cat, valor, corBg: DEFAULT_BG, corFg: DEFAULT_FG },
        });
        knownOptions.add(`${cat}::${valor}`);
        console.log(`  + criando ${cat} "${valor}" (cor neutra)`);
      }
    }

    const conjuntoIds = await Promise.all(
      (rec.conjuntos ?? "")
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => ensureNamed("conjunto", c, conjuntoCache)),
    );

    const data = {
      nome,
      personagem,
      linha: rec.linha?.trim() || null,
      escala: rec.escala?.trim() || "",
      estilo: rec.estilo?.trim() || "",
      alinhamento: rec.alinhamento?.trim() || "",
      tipo: rec.tipo?.trim() || "",
      status: rec.status?.trim() || "",
      precoEstimado: parseNumber(rec.precoEstimado ?? ""),
      faixaPreco: rec.faixaPreco?.trim() || "",
      precoConferidoEm: parseDate(rec.precoConferidoEm ?? ""),
      link: rec.link?.trim() || null,
      imagemUrl: imageUrlOrNull(rec.imagemUrl ?? ""),
      thumbUrl: imageUrlOrNull(rec.thumbUrl ?? ""),
      observacoes: rec.observacoes?.trim() || null,
      marcaId,
      grupoId,
    };

    const existing = rec.id?.trim()
      ? await prisma.figure.findUnique({ where: { id: rec.id.trim() } })
      : null;

    if (existing) {
      await prisma.figure.update({
        where: { id: existing.id },
        data: { ...data, deletedAt: null, conjuntos: { set: conjuntoIds.map((id) => ({ id })) } },
      });
      updated++;
    } else {
      await prisma.figure.create({
        data: { ...data, conjuntos: { connect: conjuntoIds.map((id) => ({ id })) } },
      });
      created++;
    }
  }

  console.log(`\n${created} criada(s) · ${updated} atualizada(s) · ${skipped} ignorada(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
