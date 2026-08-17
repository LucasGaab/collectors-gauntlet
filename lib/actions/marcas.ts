"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createMarca(formData: FormData) {
  await exigirSessao();
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;
  const count = await prisma.marca.count();

  await prisma.marca.create({ data: { nome, corBg, corFg, ordem: count } });
  revalidatePath("/listas");
}

export async function updateMarca(id: string, formData: FormData) {
  await exigirSessao();
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;

  await prisma.marca.update({ where: { id }, data: { nome, corBg, corFg } });
  revalidatePath("/listas");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function deleteMarca(id: string): Promise<{ error?: string }> {
  await exigirSessao();
  const emUso = await prisma.figure.count({ where: { marcaId: id } });
  if (emUso > 0) {
    return { error: `Não é possível remover: ${emUso} figura(s) usam esta marca.` };
  }
  await prisma.marca.delete({ where: { id } });
  revalidatePath("/listas");
  return {};
}
