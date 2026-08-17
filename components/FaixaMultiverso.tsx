import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import type { VersaoPersonagem } from "@/lib/insights";

/**
 * Multiverso do personagem (item 20): todas as suas versões do mesmo
 * personagem lado a lado. Sem hooks de propósito — a ficha (client) e a página
 * do personagem (server) renderizam exatamente a mesma faixa.
 */
export function FaixaMultiverso({
  versoes,
  atualId,
  tamanho = "sm",
}: {
  versoes: VersaoPersonagem[];
  /** A peça que você já está vendo: aparece marcada e não vira link. */
  atualId?: string;
  tamanho?: "sm" | "md";
}) {
  if (versoes.length === 0) return null;

  const largura = tamanho === "md" ? "w-40" : "w-28";

  return (
    // no-scrollbar + snap: a faixa rola no dedo sem virar uma barra cinza.
    <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
      {versoes.map((v) => {
        const atual = v.id === atualId;
        const foto = v.thumbUrl ? (
          <Image src={v.thumbUrl} alt="" fill sizes="160px" unoptimized className="object-cover" />
        ) : (
          <ImagePlaceholder />
        );

        const conteudo = (
          <>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface-high">
              {foto}
              {atual && (
                <span className="absolute inset-x-0 bottom-0 bg-primary py-0.5 text-center text-[8px] font-bold uppercase tracking-widest text-primary-foreground">
                  Esta
                </span>
              )}
            </div>
            <span className="mt-2 block truncate text-[11px] font-semibold leading-tight">
              {v.nome}
            </span>
            <span className="mt-1 block">
              <Badge label={v.marca.nome} corBg={v.marca.corBg} corFg={v.marca.corFg} />
            </span>
          </>
        );

        return atual ? (
          <div key={v.id} className={`${largura} shrink-0 snap-start`}>
            {conteudo}
          </div>
        ) : (
          <Link
            key={v.id}
            href={`/figuras/${v.id}`}
            className={`${largura} shrink-0 snap-start transition-opacity hover:opacity-80`}
          >
            {conteudo}
          </Link>
        );
      })}
    </div>
  );
}
