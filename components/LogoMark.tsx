import Image from "next/image";

/**
 * Marca (só a manopla). SVG: escala sem perda em qualquer tamanho e não passa
 * pelo otimizador de imagem. `unoptimized` porque vetor não tem o que otimizar.
 */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-mark.svg"
      alt="Collector's Gauntlet"
      width={256}
      height={256}
      className={className}
      style={{ width: size, height: size }}
      unoptimized
      priority
    />
  );
}

/**
 * Logo horizontal completo (manopla + wordmark). Usado onde há largura pra ele:
 * sidebar expandida e topo do mobile.
 */
export function LogoHorizontal({
  className,
  height,
}: {
  className?: string;
  /** Altura fixa em px. Se omitida, o dimensionamento vem do className (ex: w-full). */
  height?: number;
}) {
  return (
    <Image
      src="/logo-horizontal.svg"
      alt="Collector's Gauntlet"
      width={1292}
      height={718}
      className={className}
      style={height ? { height, width: "auto" } : undefined}
      unoptimized
      priority
    />
  );
}
