import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Stagger, StaggerItem } from "@/components/motion";
import { getVersoesDoPersonagem } from "@/lib/insights";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Props = { params: Promise<{ nome: string }> };

/**
 * O multiverso de um personagem (item 20): Mafex, Legends e Funko lado a lado.
 * O nome vem pela URL porque personagem é texto livre, não uma tabela — por
 * isso a busca é case-insensitive em vez de igualdade exata.
 */
export default async function PersonagemPage({ params }: Props) {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const { nome } = await params;
  const personagem = decodeURIComponent(nome);
  const versoes = await getVersoesDoPersonagem(personagem);

  if (versoes.length === 0) notFound();

  const valor = versoes.reduce((s, v) => s + (v.precoEstimado ?? 0), 0);
  const marcas = [...new Set(versoes.map((v) => v.marca.nome))];

  return (
    <AppShell
      title={personagem}
      subtitle={`${versoes.length} ${versoes.length === 1 ? "versão" : "versões"} no acervo`}
      actions={
        <Link
          href="/personagens"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          Todo o multiverso
        </Link>
      }
    >
      <div className="glass-card flex flex-wrap items-center gap-x-10 gap-y-4 rounded-2xl border border-border p-6">
        <div>
          <p className="eyebrow mb-1">Versões</p>
          <span className="display-title text-3xl">{versoes.length}</span>
        </div>
        <div>
          <p className="eyebrow mb-1">Valor somado</p>
          <span className="display-title text-3xl text-gold">{brl(valor)}</span>
        </div>
        <div className="min-w-0">
          <p className="eyebrow mb-2">Marcas</p>
          <span className="flex flex-wrap gap-2">
            {marcas.map((m) => {
              const cor = versoes.find((v) => v.marca.nome === m)!.marca;
              return <Badge key={m} label={m} corBg={cor.corBg} corFg={cor.corFg} size="md" />;
            })}
          </span>
        </div>
      </div>

      <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {versoes.map((v) => (
          <StaggerItem key={v.id}>
            <Link
              href={`/figuras/${v.id}`}
              className="group block overflow-hidden rounded-xl border border-border bg-surface transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-square w-full">
                {v.thumbUrl ? (
                  <Image
                    src={v.thumbUrl}
                    alt={v.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
              <div className="space-y-1.5 p-3">
                <Badge label={v.marca.nome} corBg={v.marca.corBg} corFg={v.marca.corFg} />
                <h3 className="display-title truncate text-sm leading-tight transition-colors group-hover:text-primary">
                  {v.nome}
                </h3>
                <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                  {[v.linha, v.era && `Era ${v.era}`, v.status].filter(Boolean).join(" · ")}
                </p>
                {v.precoEstimado != null && (
                  <p className="text-[11px] tabular-nums text-gold">{brl(v.precoEstimado)}</p>
                )}
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </AppShell>
  );
}
