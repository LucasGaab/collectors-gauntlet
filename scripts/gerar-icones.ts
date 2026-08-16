/**
 * Gera os PNGs de ícone do PWA a partir de app/icon.svg.
 *
 *   npx tsx scripts/gerar-icones.ts
 *
 * Rodar de novo só se a arte mudar; os PNGs ficam versionados em public/.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const svg = await readFile(path.join(process.cwd(), "app", "icon.svg"));

  for (const t of [192, 512]) {
    await sharp(svg, { density: 384 })
      .resize(t, t)
      .png()
      .toFile(path.join(process.cwd(), "public", `icone-${t}.png`));
    console.log(`gerado public/icone-${t}.png`);
  }

  // Ícone "maskable": o Android recorta em círculo, então a arte precisa caber
  // na zona segura central (~80%). Reduz a manopla e mantém o fundo sangrando.
  const arte = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#111113" } })
    .composite([{ input: arte, gravity: "center" }])
    .png()
    .toFile(path.join(process.cwd(), "public", "icone-maskable-512.png"));
  console.log("gerado public/icone-maskable-512.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
