import type { ReactNode } from "react";
import { LogoMark } from "@/components/LogoMark";

/** Ilustração de "filtro sem resultado": uma vitrine vazia com a lupa vazando. */
function NoResultsArt() {
  return (
    <svg
      viewBox="0 0 160 120"
      className="h-28 w-40"
      role="img"
      aria-label="Vitrine vazia"
      fill="none"
    >
      {/* prateleiras */}
      <rect x="18" y="16" width="124" height="86" rx="6" stroke="var(--border)" strokeWidth="2" />
      <line x1="18" y1="48" x2="142" y2="48" stroke="var(--border)" strokeWidth="2" />
      <line x1="18" y1="76" x2="142" y2="76" stroke="var(--border)" strokeWidth="2" />
      {/* silhuetas apagadas */}
      <rect x="30" y="28" width="14" height="18" rx="3" fill="var(--surface-high)" />
      <rect x="58" y="30" width="14" height="16" rx="3" fill="var(--surface-high)" />
      <rect x="102" y="56" width="14" height="18" rx="3" fill="var(--surface-high)" />
      {/* lupa */}
      <circle cx="104" cy="86" r="19" stroke="var(--primary)" strokeWidth="3" opacity="0.9" />
      <line
        x1="118"
        y1="100"
        x2="134"
        y2="116"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line
        x1="96"
        y1="86"
        x2="112"
        y2="86"
        stroke="var(--muted-foreground)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  variant = "empty",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "empty" | "no-results";
}) {
  return (
    <div className="glass-card flex flex-col items-center rounded-2xl border border-border px-8 py-20 text-center">
      {variant === "no-results" ? <NoResultsArt /> : <LogoMark size={48} className="opacity-30" />}
      <h3 className="display-title mt-6 text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
