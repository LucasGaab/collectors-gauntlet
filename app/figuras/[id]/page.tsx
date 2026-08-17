import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildOptionColorMap, getFilterOptions, NOT_DELETED } from "@/lib/queries";
import { getVersoesDoPersonagem } from "@/lib/insights";
import { AppShell } from "@/components/AppShell";
import { FigureDetail } from "@/components/FigureDetail";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function FiguraPage({ params, searchParams }: Props) {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const { id } = await params;
  const { edit } = await searchParams;

  const [figure, lists] = await Promise.all([
    prisma.figure.findFirst({
      where: { id, ...NOT_DELETED },
      include: { marca: true, grupo: true, conjuntos: true },
    }),
    getFilterOptions(),
  ]);

  if (!figure) notFound();

  const optionColors = buildOptionColorMap(lists.allOptions);
  const multiverso = await getVersoesDoPersonagem(figure.personagem);

  return (
    <AppShell title={figure.nome} subtitle={`${figure.marca.nome} • ${figure.linha ?? "Sem linha"}`}>
      <div className="glass-card mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border">
        <FigureDetail
          figure={figure}
          lists={lists}
          optionColors={optionColors}
          multiverso={multiverso}
          initialMode={edit ? "edit" : "view"}
          isModal={false}
        />
      </div>
    </AppShell>
  );
}
