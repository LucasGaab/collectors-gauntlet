function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function mixWithWhite([r, g, b]: [number, number, number], amount: number): [number, number, number] {
  return [r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount];
}

export type DarkTagStyle = {
  background: string;
  border: string;
  color: string;
};

/**
 * Deriva um estilo de "tag com opacidade" (padrao GitHub/Linear dark mode) a
 * partir da cor de marca/categoria existente. Cores pastel claras (a maioria
 * do sistema) sao usadas diretamente como borda/texto; cores ja escuras
 * (ex: Vilões, MAFEX) sao clareadas para permanecerem legiveis sobre o fundo
 * escuro, preservando o mesmo matiz.
 */
export function deriveDarkTagStyle(corBg: string): DarkTagStyle {
  const rgb = hexToRgb(corBg);
  const luminance = relativeLuminance(rgb);
  const tagRgb = luminance < 0.35 ? mixWithWhite(rgb, 0.5) : rgb;
  const tagHex = rgbToHex(tagRgb);
  const [r, g, b] = rgb;

  return {
    background: `rgba(${r}, ${g}, ${b}, 0.18)`,
    border: tagHex,
    color: tagHex,
  };
}
