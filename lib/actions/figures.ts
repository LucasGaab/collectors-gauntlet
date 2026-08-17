"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WISHLIST_STATUSES, NOT_DELETED } from "@/lib/queries";
import { saveImage, deleteImagesIfStored, copyImageFiles } from "@/lib/images";

/** Peças na lixeira só são apagadas de vez (com as imagens) depois disso. */
const TRASH_TTL_MS = 24 * 60 * 60 * 1000;

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** Nota da Ficha de Poder: inteiro de 1 a 7, ou null quando não avaliado. */
function notaOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Math.round(Number(s));
  return Number.isFinite(n) && n >= 1 && n <= 7 ? n : null;
}

function dateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function figureDataFromForm(formData: FormData) {
  return {
    nome: (formData.get("nome") as string).trim(),
    personagem: (formData.get("personagem") as string).trim(),
    linha: strOrNull(formData.get("linha")),
    escala: formData.get("escala") as string,
    estilo: formData.get("estilo") as string,
    alinhamento: formData.get("alinhamento") as string,
    tipo: formData.get("tipo") as string,
    status: formData.get("status") as string,
    precoEstimado: numOrNull(formData.get("precoEstimado")),
    faixaPreco: formData.get("faixaPreco") as string,
    link: strOrNull(formData.get("link")),
    observacoes: strOrNull(formData.get("observacoes")),
    precoConferidoEm: dateOrNull(formData.get("precoConferidoEm")),
    articulacao: notaOrNull(formData.get("articulacao")),
    pintura: notaOrNull(formData.get("pintura")),
    acessorios: notaOrNull(formData.get("acessorios")),
    semelhanca: notaOrNull(formData.get("semelhanca")),
    raridade: notaOrNull(formData.get("raridade")),
    prioridade: strOrNull(formData.get("prioridade")),
    era: strOrNull(formData.get("era")),
    alturaCm: numOrNull(formData.get("alturaCm")),
    marcaId: formData.get("marcaId") as string,
    grupoId: formData.get("grupoId") as string,
  };
}

function destinationFor(status: string): string {
  return WISHLIST_STATUSES.includes(status) ? "/wishlist" : "/";
}

/** Invalida todas as telas que leem figuras (listagens, dashboard e detalhe). */
function revalidateFigures() {
  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  revalidatePath("/precos");
  revalidatePath("/podio");
  revalidatePath("/personagens");
  revalidatePath("/personagens/[nome]", "page");
  revalidatePath("/figuras/[id]", "page");
}

/**
 * Conferência de preço (item 19): carimba a data de hoje e, quando vem um
 * valor, atualiza também o preço estimado. É a ação da fila de revisão em
 * /precos — por isso aceita ser chamada peça a peça, sem passar pelo formulário
 * inteiro.
 */
export async function conferirPreco(id: string, precoEstimado?: number | null) {
  const data: { precoConferidoEm: Date; precoEstimado?: number | null } = {
    precoConferidoEm: new Date(),
  };
  if (precoEstimado !== undefined) {
    // Valor inválido não zera o preço que já estava lá: só não mexe nele.
    if (precoEstimado === null) data.precoEstimado = null;
    else if (Number.isFinite(precoEstimado) && precoEstimado >= 0) data.precoEstimado = precoEstimado;
  }

  await prisma.figure.updateMany({ where: { id, ...NOT_DELETED }, data });
  revalidateFigures();
}

export async function createFigure(formData: FormData) {
  const data = figureDataFromForm(formData);
  const conjuntoIds = formData.getAll("conjuntoIds") as string[];
  const imageFile = formData.get("imagem") as File | null;
  const image = imageFile && imageFile.size > 0 ? await saveImage(imageFile) : null;

  await prisma.figure.create({
    data: {
      ...data,
      imagemUrl: image?.imagemUrl ?? null,
      thumbUrl: image?.thumbUrl ?? null,
      conjuntos: { connect: conjuntoIds.map((id) => ({ id })) },
    },
  });

  revalidateFigures();
  redirect(`${destinationFor(data.status)}?toast=criada`);
}

export async function updateFigure(id: string, formData: FormData) {
  const data = figureDataFromForm(formData);
  const conjuntoIds = formData.getAll("conjuntoIds") as string[];
  const imageFile = formData.get("imagem") as File | null;
  const removeImage = formData.get("removerImagem") === "on";

  const existing = await prisma.figure.findUniqueOrThrow({ where: { id } });

  let imagemUrl = existing.imagemUrl;
  let thumbUrl = existing.thumbUrl;
  if (imageFile && imageFile.size > 0) {
    await deleteImagesIfStored(existing.imagemUrl, existing.thumbUrl);
    const image = await saveImage(imageFile);
    imagemUrl = image.imagemUrl;
    thumbUrl = image.thumbUrl;
  } else if (removeImage) {
    await deleteImagesIfStored(existing.imagemUrl, existing.thumbUrl);
    imagemUrl = null;
    thumbUrl = null;
  }

  // Momento da conquista: gravado uma única vez, quando a peça deixa a wishlist.
  const conquistandoAgora =
    WISHLIST_STATUSES.includes(existing.status) && !WISHLIST_STATUSES.includes(data.status);

  await prisma.figure.update({
    where: { id },
    data: {
      ...data,
      imagemUrl,
      thumbUrl,
      ...(conquistandoAgora && !existing.conquistadaEm ? { conquistadaEm: new Date() } : {}),
      conjuntos: { set: conjuntoIds.map((cid) => ({ id: cid })) },
    },
  });

  revalidateFigures();

  // A UI comemora a conquista; regra dinâmica (wishlist vs não-wishlist).
  redirect(
    `${destinationFor(data.status)}?toast=${conquistandoAgora ? "conquistada" : "atualizada"}`,
  );
}

/**
 * Exclusão em duas etapas: marca `deletedAt` (some da UI na hora, mas dá pra
 * desfazer) e só apaga de verdade o que já passou de TRASH_TTL_MS.
 */
export async function deleteFigure(id: string) {
  await prisma.figure.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await purgeExpiredTrash();
  revalidateFigures();
}

export async function restoreFigure(id: string) {
  await prisma.figure.updateMany({ where: { id }, data: { deletedAt: null } });
  revalidateFigures();
}

async function purgeExpiredTrash() {
  const cutoff = new Date(Date.now() - TRASH_TTL_MS);
  const expired = await prisma.figure.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true, imagemUrl: true, thumbUrl: true },
  });
  if (expired.length === 0) return;

  await prisma.figure.deleteMany({ where: { id: { in: expired.map((f) => f.id) } } });
  await Promise.all(expired.map((f) => deleteImagesIfStored(f.imagemUrl, f.thumbUrl)));
}

/**
 * Duplicar peça: copia todos os campos (inclusive conjuntos e arquivos de
 * imagem) pra cadastrar uma variante.
 *
 * Devolve o id da cópia em vez de redirecionar — quem chama é o detalhe, que
 * precisa mostrar o toast e abrir a cópia em modo de edição (inclusive dentro
 * do modal interceptado, onde um redirect de servidor perderia o overlay).
 */
export async function duplicateFigure(id: string): Promise<{ id: string } | null> {
  const source = await prisma.figure.findFirst({
    where: { id, ...NOT_DELETED },
    include: { conjuntos: { select: { id: true } } },
  });
  if (!source) return null;

  const images = await copyImageFiles(source.imagemUrl, source.thumbUrl);

  // Campos copiados explicitamente: id/createdAt/updatedAt/deletedAt ficam de fora.
  const copy = await prisma.figure.create({
    data: {
      nome: `${source.nome} (cópia)`,
      personagem: source.personagem,
      linha: source.linha,
      escala: source.escala,
      estilo: source.estilo,
      alinhamento: source.alinhamento,
      tipo: source.tipo,
      status: source.status,
      precoEstimado: source.precoEstimado,
      faixaPreco: source.faixaPreco,
      link: source.link,
      imagemUrl: images.imagemUrl,
      thumbUrl: images.thumbUrl,
      observacoes: source.observacoes,
      precoConferidoEm: source.precoConferidoEm,
      marcaId: source.marcaId,
      grupoId: source.grupoId,
      conjuntos: { connect: source.conjuntos.map((c) => ({ id: c.id })) },
    },
  });

  revalidateFigures();
  return { id: copy.id };
}

/** Edição em lote: aplica um status a várias peças de uma vez. */
export async function bulkUpdateStatus(ids: string[], status: string) {
  if (ids.length === 0 || !status) return;

  // Só aceita status que existe nas Listas Auxiliares (nada de valor arbitrário).
  const valid = await prisma.option.findFirst({ where: { categoria: "status", valor: status } });
  if (!valid) return;

  await prisma.figure.updateMany({ where: { id: { in: ids }, ...NOT_DELETED }, data: { status } });
  revalidateFigures();
}

/** Exclusão em lote (soft delete), usada pela barra de seleção. */
export async function bulkDeleteFigures(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.figure.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await purgeExpiredTrash();
  revalidateFigures();
}

export async function bulkRestoreFigures(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.figure.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } });
  revalidateFigures();
}

/** Busca enxuta para a paleta de comandos (⌘K). Só os campos que ela exibe. */
export async function searchFiguresQuick(termo: string) {
  const q = termo.trim();
  if (q.length < 2) return [];

  return prisma.figure.findMany({
    where: {
      ...NOT_DELETED,
      OR: [{ nome: { contains: q } }, { personagem: { contains: q } }, { linha: { contains: q } }],
    },
    select: { id: true, nome: true, personagem: true, status: true, thumbUrl: true },
    orderBy: { nome: "asc" },
    take: 8,
  });
}

/**
 * Detecção de duplicata no cadastro: procura peças com nome ou personagem
 * parecido pra avisar antes de salvar. Comparação simples por substring — o
 * SQLite não tem trigram, e pro tamanho de uma coleção pessoal isso basta.
 */
export async function findSimilarFigures(nome: string, personagem: string) {
  const n = nome.trim();
  const p = personagem.trim();
  if (n.length < 3 && p.length < 3) return [];

  const or = [];
  if (n.length >= 3) or.push({ nome: { contains: n } });
  if (p.length >= 3) or.push({ personagem: { contains: p } });

  const found = await prisma.figure.findMany({
    where: { ...NOT_DELETED, OR: or },
    select: { id: true, nome: true, personagem: true, status: true, thumbUrl: true },
    take: 5,
  });
  return found;
}
