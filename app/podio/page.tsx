import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Stagger, StaggerItem } from "@/components/motion";
import { getPodio, type ItemPodio, type Ranking } from "@/lib/insights";

export const dynamic = "force-dynamic";

/** Ouro, prata e bronze — a medalha é a posição, não o valor do critério. */
const MEDALHAS = ["#E8C468", "#C7C9D1", "#C9803A"];

function Colocada({ item, posicao }: { item: ItemPodio; posicao: number }) {
  const medalha = MEDALHAS[posicao] ?? MEDALHAS[2];

  return (
    <Link
      href={`/figuras/${item.id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/5"
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-black/80"
        style={{ backgroundColor: medalha }}
      >
        {posicao + 1}
      </span>

      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-high">
        {item.thumbUrl ? (
          <Image src={item.thumbUrl} alt="" fill sizes="56px" unoptimized className="object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold transition-colors group-hover:text-primary">
          {item.nome}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.personagem}</span>
        <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-widest text-gold">
          {item.destaque}
        </span>
      </div>

      <Badge
        label={item.marca.nome}
        corBg={item.marca.corBg}
        corFg={item.marca.corFg}
        className="hidden shrink-0 sm:inline-flex"
      />
    </Link>
  );
}

function CartaoRanking({ ranking }: { ranking: Ranking }) {
  return (
    <div className="glass-card rounded-2xl border border-border p-6">
      <p className="caption-box">{ranking.titulo}</p>
      <p className="mt-3 text-xs text-muted-foreground">{ranking.descricao}</p>
      <div className="mt-4 space-y-1">
        {ranking.itens.map((item, i) => (
          <Colocada key={item.id} item={item} posicao={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Pódio da coleção (item 13). Rankings automáticos sobre o que já é seu — a
 * wishlist fica de fora, exceto no critério de caçada, que só existe por causa
 * dela. Rankings sem nenhuma peça pontuando não são renderizados.
 */
export default async function PodioPage() {
  const rankings = await getPodio();

  return (
    <AppShell title="Pódio" subtitle="O que se destaca na sua coleção">
      {rankings.length === 0 ? (
        <EmptyState
          title="Ainda não há o que ranquear"
          description="Cadastre peças com preço e notas na Ficha de Poder — os rankings se montam sozinhos."
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {rankings.map((r) => (
            <StaggerItem key={r.chave}>
              <CartaoRanking ranking={r} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </AppShell>
  );
}
