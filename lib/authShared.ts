/**
 * Constantes de sessão sem nenhuma dependência de servidor.
 *
 * Existe separado de `lib/auth.ts` porque o `proxy.ts` roda no runtime Edge e
 * precisa do nome do cookie — mas `lib/auth.ts` importa `server-only`, Prisma e
 * `node:crypto`, que não existem lá.
 */
export const COOKIE_SESSAO = "gauntlet_sessao";
