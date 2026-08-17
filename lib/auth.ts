import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSAO } from "@/lib/authShared";
import { conferirSenha, gerarHash } from "@/lib/senha";

// Reexportado para quem já importava daqui; a definição mora em authShared
// porque o proxy (runtime Edge) também precisa dela.
export { COOKIE_SESSAO };

/** 3 dias, renovados a cada uso: cobre o dia a dia sem manter sessão viva por semanas. */
const DURACAO_MS = 3 * 24 * 60 * 60 * 1000;

/** Renova a validade quando já passou disso — evita escrever no banco a cada
 * request. 6h: num prazo de 3 dias, renovar só a cada 24h desperdiçaria um terço. */
const RENOVAR_APOS_MS = 6 * 60 * 60 * 1000;

// Hash de senha vive em lib/senha.ts (sem server-only), pra que o script de
// terminal que define a senha também consiga importá-lo.
export { gerarHash, conferirSenha };

export async function criarSessao(usuarioId: string): Promise<void> {
  // Token opaco de 256 bits: o cookie não carrega nenhuma informação, só a
  // chave da linha. Assim nada pode ser forjado sem acesso ao banco.
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await prisma.sessao.create({ data: { token, usuarioId, expiraEm } });

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

export type SessaoAtiva = { usuarioId: string; login: string };

/**
 * Lê e valida a sessão. Esta é a checagem de verdade — o proxy só faz uma
 * verificação otimista de presença do cookie, porque roda antes e não deve
 * consultar o banco a cada request.
 */
export async function lerSessao(): Promise<SessaoAtiva | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { token },
    include: { usuario: { select: { id: true, login: true } } },
  });
  if (!sessao) return null;

  if (sessao.expiraEm.getTime() < Date.now()) {
    await prisma.sessao.delete({ where: { token } }).catch(() => {});
    return null;
  }

  // Renovação deslizante: enquanto você usa, a sessão se estende sozinha.
  if (Date.now() - sessao.ultimoUso.getTime() > RENOVAR_APOS_MS) {
    await prisma.sessao
      .update({
        where: { token },
        data: { ultimoUso: new Date(), expiraEm: new Date(Date.now() + DURACAO_MS) },
      })
      .catch(() => {});
  }

  return { usuarioId: sessao.usuario.id, login: sessao.usuario.login };
}

/** Usar no topo de toda página/ação protegida. Redireciona quem não tem sessão. */
export async function exigirSessao(): Promise<SessaoAtiva> {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) await prisma.sessao.deleteMany({ where: { token } });
  jar.delete(COOKIE_SESSAO);
}

/** Remove sessões vencidas. Chamado no login, que é raro o suficiente. */
export async function limparSessoesVencidas(): Promise<void> {
  await prisma.sessao.deleteMany({ where: { expiraEm: { lt: new Date() } } });
}
