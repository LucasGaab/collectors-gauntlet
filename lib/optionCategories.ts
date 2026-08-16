export const OPTION_CATEGORIES = [
  "escala",
  "estilo",
  "alinhamento",
  "tipo",
  "status",
  "faixaPreco",
] as const;

export type OptionCategoria = (typeof OPTION_CATEGORIES)[number];
