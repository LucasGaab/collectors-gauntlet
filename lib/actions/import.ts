"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCsv, rowsToRecords } from "@/lib/csv";

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const OPTION_CATEGORIES = [
  "escala",
  "estilo",
  "alinhamento",
  "tipo",
  "status",
  "faixaPreco",
] as const;

/** Cor neutra pra valores criados automaticamente na importação. */
const DEFAULT_BG = "#2A2A2E";
const DEFAULT_FG = "#EDEDED";

function parseNumber(v: string): number | null {
  if (!v) return null;
  // Aceita tanto "1234.56" quanto o "1.234,56" que sai de planilha pt-BR.
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

/**
 * URLs de imagem do formato antigo (`/uploads/...`, quando as fotos moravam no
 * filesystem) não existem mais depois da migração pro banco. Importar esse texto
 * cru só produziria imagem quebrada — melhor deixar sem foto e reenviar pela UI.
 */
function imageUrlOrNull(v: string): string | null {
  const url = v.trim();
  if (!url || url.startsWith("/uploads/")) return null;
  return url;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Importa um CSV (o mesmo formato do export) para edição em massa via planilha.
 *
 * - Linha com `id` de peça existente → atualiza; senão → cria.
 * - Marca/Grupo/Conjunto e valores de lista que não existirem são criados com
 *   cor neutra, pra que uma planilha editada à mão não falhe por causa disso.
 * - `imagemUrl` é preservado como texto; a importação não baixa nem gera imagem.
 */
export async function importFiguresCsv(formData: FormData): Promise<ImportResult> {
  await exigirSessao();
  const file = formData.get("arquivo") as File | null;
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  if (!file || file.size === 0) {
    result.errors.push("Nenhum arquivo enviado.");
    return result;
  }

  const records = rowsToRecords(parseCsv(await file.text()));
  if (records.length === 0) {
    result.errors.push("CSV vazio ou sem cabeçalho.");
    return result;
  }

  // Caches pra não consultar/criar o mesmo nome repetidamente.
  const marcaCache = new Map<string, string>();
  const grupoCache = new Map<string, string>();
  const conjuntoCache = new Map<string, string>();
  const knownOptions = new Set(
    (await prisma.option.findMany({ select: { categoria: true, valor: true } })).map(
      (o) => `${o.categoria}::${o.valor}`,
    ),
  );

  // Cada delegate do Prisma tem tipo próprio, então as três variantes ficam
  // explícitas em vez de um delegate "polimórfico" (que o TS não aceita chamar).
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
      id = (
        (await prisma.marca.findUnique({ where: { nome } })) ??
        (await prisma.marca.create({ data }))
      ).id;
    } else if (kind === "grupo") {
      id = (
        (await prisma.grupo.findUnique({ where: { nome } })) ??
        (await prisma.grupo.create({ data }))
      ).id;
    } else {
      id = (
        (await prisma.conjunto.findUnique({ where: { nome } })) ??
        (await prisma.conjunto.create({ data }))
      ).id;
    }

    cache.set(nome, id);
    return id;
  }

  async function ensureOption(categoria: string, valor: string) {
    const key = `${categoria}::${valor}`;
    if (knownOptions.has(key)) return;
    await prisma.option.create({
      data: { categoria, valor, corBg: DEFAULT_BG, corFg: DEFAULT_FG },
    });
    knownOptions.add(key);
  }

  for (const [index, rec] of records.entries()) {
    const line = index + 2; // +1 cabeçalho, +1 base 1
    try {
      const nome = rec.nome?.trim();
      const personagem = rec.personagem?.trim();
      if (!nome || !personagem) {
        result.skipped++;
        result.errors.push(`Linha ${line}: "nome" e "personagem" são obrigatórios.`);
        continue;
      }
      if (!rec.marca?.trim() || !rec.grupo?.trim()) {
        result.skipped++;
        result.errors.push(`Linha ${line}: "marca" e "grupo" são obrigatórios.`);
        continue;
      }

      const [marcaId, grupoId] = await Promise.all([
        ensureNamed("marca", rec.marca.trim(), marcaCache),
        ensureNamed("grupo", rec.grupo.trim(), grupoCache),
      ]);

      for (const cat of OPTION_CATEGORIES) {
        const valor = rec[cat]?.trim();
        if (valor) await ensureOption(cat, valor);
      }

      const conjuntoNomes = (rec.conjuntos ?? "")
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean);
      const conjuntoIds = await Promise.all(
        conjuntoNomes.map((c) => ensureNamed("conjunto", c, conjuntoCache)),
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
        result.updated++;
      } else {
        await prisma.figure.create({
          data: { ...data, conjuntos: { connect: conjuntoIds.map((id) => ({ id })) } },
        });
        result.created++;
      }
    } catch (err) {
      result.skipped++;
      result.errors.push(`Linha ${line}: ${err instanceof Error ? err.message : "erro"}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  revalidatePath("/listas");

  return result;
}
