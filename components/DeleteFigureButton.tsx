"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFigure, restoreFigure } from "@/lib/actions/figures";
import { useToast } from "@/components/Toast";
import { sfx } from "@/components/Sfx";

export function DeleteFigureButton({
  id,
  nome,
  variant = "text",
}: {
  id: string;
  nome: string;
  variant?: "text" | "icon";
}) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Sem confirm(): a exclusão vai pra lixeira e o toast oferece "Desfazer".
  function handleDelete() {
    sfx("POOF");
    startTransition(async () => {
      await deleteFigure(id);
      showToast(`"${nome}" removida da coleção.`, "success", {
        action: {
          label: "Desfazer",
          onClick: () => startTransition(() => restoreFigure(id)),
        },
      });
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Excluir ${nome}`}
        className="grid size-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:text-destructive disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      Excluir
    </button>
  );
}
