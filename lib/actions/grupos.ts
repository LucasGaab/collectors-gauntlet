"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createGrupo(formData: FormData) {
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;
  const count = await prisma.grupo.count();

  await prisma.grupo.create({ data: { nome, corBg, corFg, ordem: count } });
  revalidatePath("/listas");
}

export async function updateGrupo(id: string, formData: FormData) {
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;

  await prisma.grupo.update({ where: { id }, data: { nome, corBg, corFg } });
  revalidatePath("/listas");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function deleteGrupo(id: string): Promise<{ error?: string }> {
  const emUso = await prisma.figure.count({ where: { grupoId: id } });
  if (emUso > 0) {
    return { error: `Não é possível remover: ${emUso} figura(s) usam este grupo.` };
  }
  await prisma.grupo.delete({ where: { id } });
  revalidatePath("/listas");
  return {};
}
