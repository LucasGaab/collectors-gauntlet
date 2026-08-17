"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { sair } from "@/lib/actions/auth";

export function BotaoSair({ compacto = false }: { compacto?: boolean }) {
  const [pendente, iniciar] = useTransition();

  return (
    <button
      type="button"
      onClick={() => iniciar(() => sair())}
      disabled={pendente}
      title="Sair"
      aria-label="Sair"
      className={
        compacto
          ? "grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
          : "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-destructive disabled:opacity-50 lg:justify-start lg:px-2"
      }
    >
      <LogOut className="size-4" />
      {!compacto && (
        <span className="hidden text-[10px] font-bold uppercase tracking-widest lg:block">
          Sair
        </span>
      )}
    </button>
  );
}
