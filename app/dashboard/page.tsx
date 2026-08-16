import { prisma } from "@/lib/prisma";
import { NOT_DELETED, WISHLIST_STATUSES, getMetas } from "@/lib/queries";
import { MetasPainel } from "@/components/MetasPainel";
import { AppShell } from "@/components/AppShell";
import { KpiCard } from "@/components/KpiCard";
import {
  GrupoPieChart,
  MarcaBarChart,
  EscalaBarChart,
  TimelineChart,
  type ChartDatum,
  type TimelineDatum,
} from "@/components/DashboardCharts";
import { Stagger, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function DashboardPage() {
  const [metas, figures, escalaOptions, statusOptions] = await Promise.all([
    getMetas(),
    prisma.figure.findMany({ where: NOT_DELETED, include: { marca: true, grupo: true } }),
    prisma.option.findMany({ where: { categoria: "escala" } }),
    prisma.option.findMany({ where: { categoria: "status" }, orderBy: { ordem: "asc" } }),
  ]);

  const total = figures.length;

  // Os KPIs por status são derivados das Listas Auxiliares, nunca de nomes fixos:
  // o usuário pode renomear/criar/remover status pela UI e o dashboard acompanha.
  const statusCards = statusOptions.map((o) => ({
    label: o.valor,
    value: figures.filter((f) => f.status === o.valor).length,
  }));

  const isWishlist = (status: string) => WISHLIST_STATUSES.includes(status);
  const sumPreco = (items: typeof figures) =>
    items.reduce((sum, f) => sum + (f.precoEstimado ?? 0), 0);

  // "Coleção" = tudo que não é wishlist (mesma regra de getCollectionStatuses).
  const valorColecao = sumPreco(figures.filter((f) => !isWishlist(f.status)));
  const valorWishlist = sumPreco(figures.filter((f) => isWishlist(f.status)));

  function groupBy<T extends { corBg: string }>(
    items: typeof figures,
    keyFn: (f: (typeof figures)[number]) => string,
    colorFn: (f: (typeof figures)[number]) => T,
  ): ChartDatum[] {
    const map = new Map<string, { count: number; corBg: string }>();
    for (const f of items) {
      const key = keyFn(f);
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { count: 1, corBg: colorFn(f).corBg });
    }
    return [...map.entries()].map(([name, v]) => ({ name, value: v.count, corBg: v.corBg }));
  }

  // Linha do tempo: quantas peças entraram por mês e o acumulado até ali.
  const porMes = new Map<string, number>();
  for (const f of figures) {
    const chave = f.createdAt.toISOString().slice(0, 7); // AAAA-MM
    porMes.set(chave, (porMes.get(chave) ?? 0) + 1);
  }
  const timelineData: TimelineDatum[] = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<TimelineDatum[]>((acc, [chave, novas]) => {
      const [ano, mes] = chave.split("-");
      const acumulado = (acc.at(-1)?.acumulado ?? 0) + novas;
      acc.push({ mes: `${mes}/${ano.slice(2)}`, novas, acumulado });
      return acc;
    }, []);

  const grupoData = groupBy(figures, (f) => f.grupo.nome, (f) => f.grupo);
  const marcaData = groupBy(figures, (f) => f.marca.nome, (f) => f.marca);

  const escalaColorByValor = new Map(escalaOptions.map((o) => [o.valor, o.corBg]));
  const escalaData = groupBy(
    figures,
    (f) => f.escala,
    (f) => ({ corBg: escalaColorByValor.get(f.escala) ?? "#EFEFEF" }),
  );

  return (
    <AppShell title="Dashboard" subtitle="Panorama da coleção">
      <Stagger className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <StaggerItem className="md:col-span-2">
          <KpiCard label="Total de peças" value={total} hero />
        </StaggerItem>
        <StaggerItem className="md:col-span-2">
          <div className="glass-card relative overflow-hidden rounded-2xl border border-border p-6">
            <div className="absolute -right-6 -top-6 size-28 rounded-full bg-gold/10 blur-3xl" />
            <p className="eyebrow mb-4">Valor estimado da coleção</p>
            <span className="display-title block text-4xl text-gold md:text-5xl">{brl(valorColecao)}</span>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Wishlist estimada em {brl(valorWishlist)}
            </p>
          </div>
        </StaggerItem>
        {statusCards.map((s) => (
          <StaggerItem key={s.label}>
            <KpiCard label={s.label} value={s.value} />
          </StaggerItem>
        ))}
      </Stagger>

      <TimelineChart data={timelineData} />

      <MetasPainel grupos={metas.grupos} conjuntos={metas.conjuntos} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GrupoPieChart data={grupoData} />
        <MarcaBarChart data={marcaData} />
        <EscalaBarChart data={escalaData} />
      </div>
    </AppShell>
  );
}
