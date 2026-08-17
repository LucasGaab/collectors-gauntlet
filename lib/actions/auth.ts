"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao, limparSessoesVencidas } from "@/lib/auth";
import { conferirSenha } from "@/lib/senha";

export type EstadoLogin = { erro?: string };

/** Atraso mínimo do login, pra não revelar por tempo se o usuário existe. */
const PISO_MS = 400;

export async function entrar(
  _anterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const inicio = Date.now();
  const login = (formData.get("login") ?? "").toString().trim();
  const senha = (formData.get("senha") ?? "").toString();

  const nivelar = async () => {
    const restante = PISO_MS - (Date.now() - inicio);
    if (restante > 0) await new Promise((r) => setTimeout(r, restante));
  };

  if (!login || !senha) {
    await nivelar();
    return { erro: "Preencha usuário e senha." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { login } });

  // Mensagem única para usuário inexistente e senha errada: dizer qual dos dois
  // falhou entregaria de graça se o login existe.
  const ok = usuario ? await conferirSenha(senha, usuario.senhaHash) : false;
  if (!usuario || !ok) {
    await nivelar();
    return { erro: "Usuário ou senha inválidos." };
  }

  await limparSessoesVencidas();
  await criarSessao(usuario.id);

  // redirect() lança por dentro; precisa ficar fora de try/catch.
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
