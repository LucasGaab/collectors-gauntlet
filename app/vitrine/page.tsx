import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NOT_DELETED, getCollectionStatuses } from "@/lib/queries";
import { getPreferencias } from "@/lib/preferencias";
import { LogoHorizontal } from "@/components/LogoMark";
import { Vitrine } from "@/components/Vitrine";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vitrine — Collector's Gauntlet",
  description: "Galeria da coleção",
};

/**
 * Página pública somente-leitura, pensada pra compartilhar com outras pessoas:
 * mostra só o que já está na coleção (wishlist fica de fora) e não expõe
 * nenhum caminho de edição — sem AppShell, sem botões de editar/excluir.
 */
export default async function VitrinePage() {
  const [statusesColecao, prefs] = await Promise.all([getCollectionStatuses(), getPreferencias()]);

  const pecas = await prisma.figure.findMany({
    where: { ...NOT_DELETED, status: { in: statusesColecao } },
    orderBy: [{ grupoId: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      personagem: true,
      linha: true,
      status: true,
      imagemUrl: true,
      thumbUrl: true,
      marca: { select: { nome: true, corBg: true, corFg: true } },
      grupo: { select: { nome: true, corBg: true, corFg: true } },
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-6">
          <div className="flex min-w-0 items-center gap-4">
            <LogoHorizontal height={40} />
            {prefs.nomeColecao && (
              <span className="display-title truncate border-l border-border pl-4 text-xl text-gold">
                {prefs.nomeColecao}
              </span>
            )}
          </div>
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
          >
            Gerenciar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {pecas.length === 0 ? (
          <EmptyState
            title="A vitrine está vazia"
            description="Peças aparecem aqui assim que entram na coleção."
          />
        ) : (
          <Vitrine pecas={pecas} />
        )}

        <p className="mt-16 text-center text-[10px] leading-relaxed text-muted-foreground/70">
          Projeto pessoal de fã. Sem afiliação com Marvel, Disney ou fabricantes de action figures.
        </p>
      </main>
    </div>
  );
}
