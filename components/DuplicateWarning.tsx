"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { findSimilarFigures } from "@/lib/actions/figures";

type Similar = {
  id: string;
  nome: string;
  personagem: string;
  status: string;
};

/**
 * Aviso (não bloqueante) de possível duplicata no cadastro: consulta peças com
 * nome/personagem parecido enquanto o usuário digita. Nunca impede o salvamento
 * — variantes legítimas com nomes quase iguais são comuns numa coleção.
 */
export function DuplicateWarning({ nome, personagem }: { nome: string; personagem: string }) {
  const [similar, setSimilar] = useState<Similar[]>([]);

  useEffect(() => {
    const n = nome.trim();
    const p = personagem.trim();

    let cancelled = false;
    // Toda atualização de estado acontece dentro do debounce (nunca no corpo do
    // efeito), inclusive a limpeza quando o texto fica curto demais pra buscar.
    const timer = setTimeout(async () => {
      const found = n.length < 3 && p.length < 3 ? [] : await findSimilarFigures(n, p);
      if (!cancelled) setSimilar(found);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nome, personagem]);

  if (similar.length === 0) return null;

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold">
        <AlertTriangle className="size-3.5" />
        Já existe algo parecido na coleção
      </p>
      <ul className="mt-3 space-y-1.5">
        {similar.map((s) => (
          <li key={s.id} className="text-sm">
            <Link
              href={`/figuras/${s.id}`}
              target="_blank"
              className="text-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              {s.nome}
            </Link>
            <span className="text-muted-foreground"> · {s.personagem} · {s.status}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Se for uma variante diferente, pode salvar normalmente.
      </p>
    </div>
  );
}
