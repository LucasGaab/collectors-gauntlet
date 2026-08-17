import { NOTA_MAX } from "@/lib/ficha";

/** A partir desta nota a peça é considerada rara e ganha selo. */
export const RARIDADE_MINIMA = 6;

/**
 * Selo metálico em relevo (item 08), exibido só nas peças com nota de raridade
 * alta na Ficha de Poder. Sem nota, ou com nota baixa, não renderiza nada —
 * o selo perde o sentido se aparecer em tudo.
 */
export function SeloRaridade({
  raridade,
  className,
}: {
  raridade: number | null;
  className?: string;
}) {
  if (raridade == null || raridade < RARIDADE_MINIMA) return null;

  const maxima = raridade >= NOTA_MAX;

  return (
    <span
      title={`Raridade ${raridade} de ${NOTA_MAX}`}
      className={`selo-relevo pointer-events-none absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full ${className ?? ""}`}
    >
      <span className="display-title text-[13px] leading-none text-black">
        {maxima ? "★" : raridade}
      </span>
    </span>
  );
}
