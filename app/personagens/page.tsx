import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Stagger, StaggerItem } from "@/components/motion";
import { getMultiverso } from "@/lib/insights";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Índice do multiverso (item 20): só personagens dos quais você tem mais de uma
 * versão — quem tem uma peça só já aparece na Coleção e não ganha nada aqui.
 */
export default async function PersonagensPage() {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const personagens = await getMultiverso();

  return (
    <AppShell title="Multiverso" subtitle="Personagens dos quais você tem mais de uma versão">
      {personagens.length === 0 ? (
        <EmptyState
          title="Nenhum personagem repetido"
          description="Quando você tiver duas versões do mesmo personagem, elas se reúnem aqui."
        />
      ) : (
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {personagens.map((p) => (
            <StaggerItem key={p.personagem}>
              <Link
                href={`/personagens/${encodeURIComponent(p.personagem)}`}
                className="group block overflow-hidden rounded-xl border border-border bg-surface transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full">
                  {p.capaUrl ? (
                    <Image
                      src={p.capaUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    {p.versoes} versões
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="display-title truncate text-sm leading-tight transition-colors group-hover:text-primary">
                    {p.personagem}
                  </h3>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.marcas.join(" · ")}
                  </p>
                  {p.valor > 0 && (
                    <p className="mt-1 text-[11px] tabular-nums text-gold">{brl(p.valor)}</p>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </AppShell>
  );
}
