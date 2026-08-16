"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Não sequestra teclas enquanto o usuário digita num campo. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * Atalhos globais da listagem:
 *   `/` foca a busca · `n` abre o cadastro de nova peça.
 * Fica inerte quando há um modal aberto (o modal tem os próprios atalhos).
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (document.querySelector("[data-modal-open]")) return;

      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>("input[type='search'], input[data-search-input]");
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        router.push("/nova");
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
