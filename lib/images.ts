import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/**
 * Upload de imagem: o arquivo original nunca é gravado como veio.
 * Tudo é reencodado em WebP — uma versão "cheia" limitada a 1600px (usada no
 * detalhe e no lightbox) e uma miniatura de 320px (usada na tabela e no grid),
 * pra não servir um JPEG de 8MB dentro de uma célula de 40px.
 */
const FULL_MAX = 1600;
const THUMB_MAX = 320;

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedImage = { imagemUrl: string; thumbUrl: string };

export async function saveImage(file: File): Promise<SavedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  // O nome do arquivo é sempre gerado por nós (uuid + .webp): o nome enviado
  // pelo cliente nunca toca o filesystem.
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

  await mkdir(UPLOADS_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(UPLOADS_DIR, `${id}.webp`), full),
    writeFile(path.join(UPLOADS_DIR, `${id}-thumb.webp`), thumb),
  ]);

  return { imagemUrl: `/uploads/${id}.webp`, thumbUrl: `/uploads/${id}-thumb.webp` };
}

/**
 * Copia os arquivos de imagem de uma peça pra uma nova peça (usado ao duplicar).
 * Cada figura fica dona dos seus próprios arquivos, então apagar uma nunca
 * deixa a outra sem foto. URLs externas são apenas reaproveitadas.
 */
export async function copyImageFiles(
  imagemUrl: string | null,
  thumbUrl: string | null,
): Promise<{ imagemUrl: string | null; thumbUrl: string | null }> {
  if (!imagemUrl?.startsWith("/uploads/")) return { imagemUrl, thumbUrl };

  const id = randomUUID();
  await mkdir(UPLOADS_DIR, { recursive: true });

  const copyOne = async (url: string | null, suffix: string) => {
    if (!url?.startsWith("/uploads/")) return null;
    const source = path.basename(url);
    try {
      const data = await readFile(path.join(UPLOADS_DIR, source));
      // Mantém a extensão real do arquivo de origem: uploads antigos ainda são
      // .jpg/.png e renomeá-los pra .webp deixaria o nome mentindo sobre o conteúdo.
      const ext = path.extname(source) || ".webp";
      const name = `${id}${suffix}${ext}`;
      await writeFile(path.join(UPLOADS_DIR, name), data);
      return `/uploads/${name}`;
    } catch {
      return null;
    }
  };

  return {
    imagemUrl: await copyOne(imagemUrl, ""),
    thumbUrl: await copyOne(thumbUrl, "-thumb"),
  };
}

/** Remove um arquivo servido de /uploads; ignora URLs externas e erros de arquivo ausente. */
export async function deleteImageIfLocal(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  try {
    await unlink(path.join(UPLOADS_DIR, name));
  } catch {
    // arquivo já removido — nada a fazer
  }
}

export async function deleteImagesIfLocal(...urls: (string | null | undefined)[]) {
  await Promise.all(urls.map(deleteImageIfLocal));
}
