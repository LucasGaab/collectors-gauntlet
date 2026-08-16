import { getCollectionStatuses } from "@/lib/queries";
import { CollectionView, normalizeSearchParams } from "@/components/CollectionView";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  const [rawParams, scopeStatuses] = await Promise.all([searchParams, getCollectionStatuses()]);
  const params = normalizeSearchParams(rawParams);

  return (
    <CollectionView
      title="Coleção"
      subtitle="Peças que já são suas — qualquer status além de Lista de Desejos"
      emptyTitle="Nenhuma peça encontrada"
      emptyDescription="Ajuste os filtros ou limpe a busca para ver o restante da sua vitrine."
      scopeStatuses={scopeStatuses}
      showConjuntoFilter
      params={params}
    />
  );
}
