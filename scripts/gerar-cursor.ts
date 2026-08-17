/**
 * Gera o cursor da manopla (item 06) a partir de public/logo-mark.svg.
 *
 *   npx tsx scripts/gerar-cursor.ts
 *
 * 30px porque os navegadores ignoram cursores muito grandes (o limite prático
 * fica em torno de 32px). Rodar de novo só se a arte mudar.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const svg = await readFile(path.join(process.cwd(), "public", "logo-mark.svg"));
  const destino = path.join(process.cwd(), "public", "cursor-manopla.png");

  await sharp(svg, { density: 300 })
    .resize(30, 30, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(destino);

  console.log("gerado public/cursor-manopla.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
