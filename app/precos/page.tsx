import { AppShell } from "@/components/AppShell";
import { PrecosPainel } from "@/components/PrecosPainel";
import { getPrecosDefasados, MESES_ATE_DEFASAR } from "@/lib/insights";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Preços defasados (item 19). Vive de um campo que já existia e só era exibido:
 * `precoConferidoEm`. Wishlist entra junto — preço de peça que você ainda quer
 * envelhece igual, e é justamente o que decide a próxima compra.
 */
export default async function PrecosPage() {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const pecas = await getPrecosDefasados();

  return (
    <AppShell
      title="Preços defasados"
      subtitle={`Conferência vencida há mais de ${MESES_ATE_DEFASAR} meses`}
    >
      <PrecosPainel pecas={pecas} meses={MESES_ATE_DEFASAR} />
    </AppShell>
  );
}
