import { getFilterOptions } from "@/lib/queries";
import { createFigure } from "@/lib/actions/figures";
import { AppShell } from "@/components/AppShell";
import { FigureForm } from "@/components/FigureForm";
import { FadeIn } from "@/components/motion";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NovaFiguraPage() {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const lists = await getFilterOptions();

  return (
    <AppShell title="Nova figura" subtitle="Catalogar uma peça na sua coleção">
      <FadeIn className="glass-card rounded-2xl border border-border p-8">
        <FigureForm action={createFigure} lists={lists} />
      </FadeIn>
    </AppShell>
  );
}
