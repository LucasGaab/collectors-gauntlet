import sharp from "sharp";
import { prisma } from "@/lib/prisma";

/**
 * Armazenamento de imagem no banco (tabela `Imagem`), não no filesystem:
 * em serverless o disco é efêmero e read-only, então gravar em `public/uploads`
 * perderia as fotos a cada deploy.
 *
 * O arquivo enviado nunca é guardado como veio — tudo é reencodado em WebP em
 * duas versões: uma "cheia" de até 1600px (detalhe e lightbox) e uma miniatura
 * de 320px (tabela e grid), pra não trafegar um JPEG de 8MB numa célula de 40px.
 *
 * As figuras guardam só a URL (`/api/imagem/<id>`), servida pelo route handler
 * em app/api/imagem/[id]/route.ts.
 */
const FULL_MAX = 1600;
const THUMB_MAX = 320;
const MIME = "image/webp";

export type SavedImage = { imagemUrl: string; thumbUrl: string };

const urlFor = (id: string) => `/api/imagem/${id}`;

/** Extrai o id de uma URL `/api/imagem/<id>`; null se não for imagem nossa. */
function idFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /^\/api\/imagem\/([^/?#]+)$/.exec(url);
  return match ? match[1] : null;
}

export async function saveImage(file: File): Promise<SavedImage> {
  const input = Buffer.from(await file.arrayBuffer());

  const [full, thumb] = await Promise.all([
    sharp(input)
      .rotate()
      .resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(input)
      .rotate()
      .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer(),
  ]);

  const [fullRow, thumbRow] = await Promise.all([
    prisma.imagem.create({ data: { mimeType: MIME, data: full }, select: { id: true } }),
    prisma.imagem.create({ data: { mimeType: MIME, data: thumb }, select: { id: true } }),
  ]);

  return { imagemUrl: urlFor(fullRow.id), thumbUrl: urlFor(thumbRow.id) };
}

/**
 * Duplica os bytes de uma imagem para uma nova peça (usado ao duplicar figura).
 * Cada figura fica dona das suas próprias linhas, então excluir uma nunca deixa
 * a outra sem foto. URLs externas são apenas reaproveitadas como texto.
 */
export async function copyImageFiles(
  imagemUrl: string | null,
  thumbUrl: string | null,
): Promise<{ imagemUrl: string | null; thumbUrl: string | null }> {
  const copyOne = async (url: string | null) => {
    const id = idFromUrl(url);
    if (!id) return url ?? null; // externa ou vazia: mantém como está
    const source = await prisma.imagem.findUnique({ where: { id } });
    if (!source) return null;
    const copy = await prisma.imagem.create({
      data: { mimeType: source.mimeType, data: source.data },
      select: { id: true },
    });
    return urlFor(copy.id);
  };

  return {
    imagemUrl: await copyOne(imagemUrl),
    thumbUrl: await copyOne(thumbUrl),
  };
}

/** Remove a linha de imagem apontada pela URL; ignora URLs externas. */
export async function deleteImageIfStored(url: string | null | undefined) {
  const id = idFromUrl(url);
  if (!id) return;
  await prisma.imagem.deleteMany({ where: { id } });
}

export async function deleteImagesIfStored(...urls: (string | null | undefined)[]) {
  await Promise.all(urls.map(deleteImageIfStored));
}
