import { prisma } from "@/lib/prisma";
import { NOT_DELETED } from "@/lib/queries";
import { CSV_COLUMNS, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Backup da coleção em CSV — mesmo formato aceito pela importação. */
export async function GET() {
  const figures = await prisma.figure.findMany({
    where: NOT_DELETED,
    include: { marca: true, grupo: true, conjuntos: true },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[][] = [
    [...CSV_COLUMNS],
    ...figures.map((f) => [
      f.id,
      f.nome,
      f.personagem,
      f.linha ?? "",
      f.marca.nome,
      f.grupo.nome,
      f.conjuntos.map((c) => c.nome).join("; "),
      f.escala,
      f.estilo,
      f.alinhamento,
      f.tipo,
      f.status,
      f.precoEstimado != null ? String(f.precoEstimado) : "",
      f.faixaPreco,
      f.precoConferidoEm ? f.precoConferidoEm.toISOString().slice(0, 10) : "",
      f.link ?? "",
      f.imagemUrl ?? "",
      f.thumbUrl ?? "",
      f.observacoes ?? "",
    ]),
  ];

  const date = new Date().toISOString().slice(0, 10);
  // BOM pro Excel abrir acentuação corretamente.
  const body = `﻿${toCsv(rows)}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="collectors-gauntlet-${date}.csv"`,
    },
  });
}
