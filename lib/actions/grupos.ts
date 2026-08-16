"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Meta vazia significa "sem alvo manual" — o progresso usa o total catalogado. */
function metaFromForm(formData: FormData): number | null {
  const raw = (formData.get("meta") ?? "").toString().trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export async function createGrupo(formData: FormData) {
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;
  const count = await prisma.grupo.count();

  await prisma.grupo.create({
    data: { nome, corBg, corFg, ordem: count, meta: metaFromForm(formData) },
  });
  revalidatePath("/listas");
}

export async function updateGrupo(id: string, formData: FormData) {
  const nome = (formData.get("nome") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;

  await prisma.grupo.update({
    where: { id },
    data: { nome, corBg, corFg, meta: metaFromForm(formData) },
  });
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
