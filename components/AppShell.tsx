"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  Heart,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/LogoMark";

const NAV = [
  { to: "/", label: "Coleção", icon: Boxes },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/listas", label: "Listas", icon: SlidersHorizontal },
] as const;

const STORAGE_KEY = "gauntlet-sidebar-collapsed";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Preferência client-only (localStorage não existe durante SSR), lida uma vez ao montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // No celular a sidebar dá lugar a uma navbar inferior: 80px fixos de menu
  // lateral comem 21% de uma tela de 375px.
  const sidebarWidth = collapsed ? "md:w-20" : "md:w-20 lg:w-64";
  const mainPadding = collapsed ? "md:pl-20" : "md:pl-20 lg:pl-64";
  const showLabels = !collapsed;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-full md:flex ${sidebarWidth} flex-col border-r border-border bg-surface transition-[width] duration-200`}
      >
        <div className="flex items-center justify-between gap-2 p-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <LogoMark size={40} className="shrink-0" />
            {showLabels && (
              <span className="display-title hidden truncate text-xl leading-5 lg:block">
                Collector&apos;s Gauntlet
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                title={label}
                className={
                  "flex items-center gap-4 rounded-lg px-4 py-3 transition-colors duration-200 " +
                  (active
                    ? "border-l-2 border-primary bg-surface-high text-primary"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")
                }
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} />
                {showLabels && (
                  <span className="hidden text-xs font-semibold uppercase tracking-widest lg:block">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground lg:justify-start lg:px-2"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {showLabels && (
              <span className="hidden text-[10px] font-bold uppercase tracking-widest lg:block">
                Recolher
              </span>
            )}
          </button>
        </div>

        {showLabels && (
          <p className="hidden px-6 pb-5 text-[9px] leading-relaxed text-muted-foreground/70 lg:block">
            Projeto pessoal de fã. Sem afiliação com Marvel, Disney ou fabricantes de action
            figures.
          </p>
        )}
      </aside>

      {/* Navbar inferior — só no mobile. pb com safe-area pro indicador do iPhone. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              href={to}
              className={
                "flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors " +
                (active ? "text-primary" : "text-muted-foreground")
              }
            >
              <Icon className="size-5" strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* pb-20 reserva espaço pra navbar; no desktop ela não existe. */}
      <main className={`${mainPadding} pb-20 transition-[padding] duration-200 md:pb-0`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-md md:h-20 md:gap-6 md:px-8">
          <div className="min-w-0">
            <h1 className="display-title truncate text-lg md:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        </header>

        <div className="mx-auto max-w-[1800px] space-y-6 p-4 md:space-y-8 md:p-6">{children}</div>
      </main>
    </div>
  );
}
