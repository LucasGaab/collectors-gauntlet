import { AppShell } from "@/components/AppShell";
import { FadeIn } from "@/components/motion";
import { getPreferencias } from "@/lib/preferencias";
import { PreferenciasForm } from "@/components/PreferenciasForm";

import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PreferenciasPage() {
  // Checagem real de sessão: o proxy só confere presença de cookie.
  await exigirSessao();

  const prefs = await getPreferencias();

  return (
    <AppShell title="Preferências" subtitle="A cara e o comportamento do seu app">
      <FadeIn className="glass-card rounded-2xl border border-border p-6 md:p-8">
        <PreferenciasForm prefs={prefs} />
      </FadeIn>
    </AppShell>
  );
}
