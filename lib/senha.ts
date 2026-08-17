import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash de senha, isolado de `lib/auth.ts` de propósito.
 *
 * `lib/auth.ts` importa `server-only`, cookies e Prisma — nada disso existe num
 * script de terminal, e era o que impedia `scripts/definir-senha.ts` de rodar.
 * Aqui é criptografia pura: serve tanto ao app quanto à linha de comando.
 *
 * scrypt em vez de bcrypt/argon2 porque estes trazem binário nativo, que
 * complica o build na Vercel. scrypt é lento por design e vem embutido no Node.
 */
const scrypt = promisify(scryptCb) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO_CHAVE = 64;

export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const derivado = await scrypt(senha, sal, TAMANHO_CHAVE);
  return `scrypt$${sal.toString("hex")}$${derivado.toString("hex")}`;
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  const [algoritmo, salHex, esperadoHex] = hash.split("$");
  if (algoritmo !== "scrypt" || !salHex || !esperadoHex) return false;

  const derivado = await scrypt(senha, Buffer.from(salHex, "hex"), TAMANHO_CHAVE);
  const esperado = Buffer.from(esperadoHex, "hex");
  if (derivado.length !== esperado.length) return false;

  // Comparação em tempo constante: um `===` vazaria o tamanho do prefixo
  // correto pelo tempo de resposta.
  return timingSafeEqual(derivado, esperado);
}
