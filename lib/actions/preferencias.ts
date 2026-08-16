"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PREFS_ID, TEMAS } from "@/lib/preferencias";

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? "").toString().trim();
  if (s === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Salva as preferências. Revalida tudo: tema e densidade afetam todas as telas. */
export async function salvarPreferencias(formData: FormData) {
  const temaBruto = (formData.get("tema") ?? "").toString();
  // Só aceita tema conhecido — o valor vira atributo no <html>.
  const tema = TEMAS.some((t) => t.id === temaBruto) ? temaBruto : "obsidian";

  const densidadeBruta = Number(formData.get("densidade"));
  const densidade = Number.isFinite(densidadeBruta)
    ? Math.min(7, Math.max(3, Math.round(densidadeBruta)))
    : 5;

  const nome = (formData.get("nomeColecao") ?? "").toString().trim();

  await prisma.preferencias.upsert({
    where: { id: PREFS_ID },
    create: {
      id: PREFS_ID,
      tema,
      densidade,
      nomeColecao: nome || null,
      orcamentoMensal: numOrNull(formData.get("orcamentoMensal")),
      graoPapel: formData.get("graoPapel") === "on",
      somAmbiente: formData.get("somAmbiente") === "on",
    },
    update: {
      tema,
      densidade,
      nomeColecao: nome || null,
      orcamentoMensal: numOrNull(formData.get("orcamentoMensal")),
      graoPapel: formData.get("graoPapel") === "on",
      somAmbiente: formData.get("somAmbiente") === "on",
    },
  });

  revalidatePath("/", "layout");
}
