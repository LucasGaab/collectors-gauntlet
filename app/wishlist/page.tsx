import { WISHLIST_STATUSES } from "@/lib/queries";
import { CollectionView, normalizeSearchParams } from "@/components/CollectionView";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WishlistPage({ searchParams }: Props) {
  const params = normalizeSearchParams(await searchParams);

  return (
    <CollectionView
      title="Wishlist"
      subtitle="Peças que você ainda quer conquistar"
      emptyTitle="Sua wishlist está vazia"
      emptyDescription="Ajuste os filtros ou adicione uma nova peça como Lista de Desejos."
      scopeStatuses={WISHLIST_STATUSES}
      showConjuntoFilter={false}
      params={params}
    />
  );
}
