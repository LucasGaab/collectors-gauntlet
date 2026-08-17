"use server";

import { exigirSessao } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { OptionCategoria } from "@/lib/optionCategories";

export async function createOption(formData: FormData) {
  await exigirSessao();
  const categoria = formData.get("categoria") as OptionCategoria;
  const valor = (formData.get("valor") as string).trim();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;
  const count = await prisma.option.count({ where: { categoria } });

  await prisma.option.create({
    data: { categoria, valor, corBg, corFg, ordem: count },
  });
  revalidatePath("/listas");
}

export async function updateOption(id: string, formData: FormData) {
  await exigirSessao();
  const corBg = formData.get("corBg") as string;
  const corFg = formData.get("corFg") as string;
  const novoValor = (formData.get("valor") as string).trim();

  const existing = await prisma.option.findUniqueOrThrow({ where: { id } });

  await prisma.$transaction(async (tx) => {
    await tx.option.update({ where: { id }, data: { valor: novoValor, corBg, corFg } });

    if (novoValor !== existing.valor) {
      await tx.figure.updateMany({
        where: { [existing.categoria]: existing.valor } as Record<string, string>,
        data: { [existing.categoria]: novoValor } as Record<string, string>,
      });
    }
  });

  revalidatePath("/listas");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function deleteOption(id: string): Promise<{ error?: string }> {
  await exigirSessao();
  const existing = await prisma.option.findUniqueOrThrow({ where: { id } });

  const emUso = await prisma.figure.count({
    where: { [existing.categoria]: existing.valor } as Record<string, string>,
  });
  if (emUso > 0) {
    return { error: `Não é possível remover: ${emUso} figura(s) usam este valor.` };
  }

  await prisma.option.delete({ where: { id } });
  revalidatePath("/listas");
  return {};
}
