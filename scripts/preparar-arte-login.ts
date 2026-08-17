/**
 * Converte a arte da tela de login para WebP.
 *
 *   npx tsx scripts/preparar-arte-login.ts <caminho-do-png>
 *
 * O PNG original tem alguns MB; na tela de login ele é a primeira coisa que o
 * navegador baixa, então vale reencodar. Roda uma vez, o resultado é versionado.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const origem = process.argv[2];
  if (!origem) {
    console.error("Uso: npx tsx scripts/preparar-arte-login.ts <arquivo.png>");
    process.exit(1);
  }

  const destino = path.join(process.cwd(), "public", "login-arte.webp");
  const entrada = await readFile(origem);
  const meta = await sharp(entrada).metadata();

  await sharp(entrada)
    .resize({ width: 1100, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(destino);

  const antes = (await stat(origem)).size;
  const depois = (await stat(destino)).size;
  console.log(`original: ${meta.width}x${meta.height}, ${(antes / 1024).toFixed(0)} KB`);
  console.log(`gerado:   public/login-arte.webp, ${(depois / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
