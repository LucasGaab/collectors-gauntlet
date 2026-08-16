export type ColorPair = { corBg: string; corFg: string };

export const MARCA_COLORS: Record<string, ColorPair> = {
  MAFEX: { corBg: "#7B241C", corFg: "#FFFFFF" },
  "S.H.Figuarts": { corBg: "#C9DDF2", corFg: "#1F3864" },
  "Marvel Legends": { corBg: "#F2B6B6", corFg: "#7A2020" },
  "Revoltech / Amazing Yamaguchi": { corBg: "#F6CBA0", corFg: "#6B3A10" },
  Mezco: { corBg: "#D6C6E1", corFg: "#4B2E63" },
  "Hot Toys": { corBg: "#F0DFA8", corFg: "#6B5410" },
  "ZD Toys": { corBg: "#8FB4DD", corFg: "#1F3864" },
  "CT Toys": { corBg: "#E8D9C8", corFg: "#5A4632" },
  Blokees: { corBg: "#B8DED2", corFg: "#1F5C4C" },
  Outra: { corBg: "#EFEFEF", corFg: "#3D3D3D" },
};

export const GRUPO_COLORS: Record<string, ColorPair> = {
  Avengers: { corBg: "#C9DDF2", corFg: "#1F3864" },
  "Spider-Verse": { corBg: "#F2C6C6", corFg: "#7A2020" },
  "X-Men": { corBg: "#F5E1A4", corFg: "#6B5410" },
  "Quarteto Fantástico": { corBg: "#C6E8E8", corFg: "#1F5C5C" },
  "Marvel Knights": { corBg: "#DCC9E8", corFg: "#4B2E63" },
  "Guardiões da Galáxia": { corBg: "#C9E8C9", corFg: "#2E5C2E" },
  Vilões: { corBg: "#6E2C3D", corFg: "#FFFFFF" },
  Outros: { corBg: "#E0E0E0", corFg: "#3D3D3D" },
};

export const STATUS_COLORS: Record<string, ColorPair> = {
  "Lista de Desejos": { corBg: "#F4A9A0", corFg: "#7A2020" },
  "Em Pré-venda": { corBg: "#D6BEEA", corFg: "#4B2E63" },
  Comprado: { corBg: "#AFD0F0", corFg: "#1F3864" },
  "Em Trânsito": { corBg: "#FCE0A0", corFg: "#6B5410" },
  "Na Estante": { corBg: "#B9E4C9", corFg: "#2E5C2E" },
};

export const ALINHAMENTO_COLORS: Record<string, ColorPair> = {
  Herói: { corBg: "#D3E6F7", corFg: "#1F3864" },
  Vilão: { corBg: "#C1666B", corFg: "#FFFFFF" },
  "Anti-herói": { corBg: "#CFC3D9", corFg: "#4B2E63" },
};

export const TIPO_COLORS: Record<string, ColorPair> = {
  Oficial: { corBg: "#B7E4C7", corFg: "#1E5631" },
  Bootleg: { corBg: "#F7C59F", corFg: "#7A3E10" },
  "Não oficial": { corBg: "#D6D6D6", corFg: "#3D3D3D" },
};

export const FAIXA_PRECO_COLORS: Record<string, ColorPair> = {
  Econômica: { corBg: "#C9E8C9", corFg: "#2E5C2E" },
  Intermediária: { corBg: "#FCEBB6", corFg: "#6B5410" },
  Premium: { corBg: "#E8C468", corFg: "#5A3E00" },
};

export const ESCALA_COLORS: Record<string, ColorPair> = {
  "1/12": { corBg: "#D6EAF8", corFg: "#1B4F72" },
  "1/10": { corBg: "#FADBD8", corFg: "#78281F" },
  "1/6": { corBg: "#D5F5E3", corFg: "#1D8348" },
  Outro: { corBg: "#E0E0E0", corFg: "#3D3D3D" },
};

export const ESTILO_COLORS: Record<string, ColorPair> = {
  Comic: { corBg: "#FCF3CF", corFg: "#7D6608" },
  MCU: { corBg: "#D6DBF5", corFg: "#283593" },
  "Spider-Verse": { corBg: "#F5D6E8", corFg: "#7D1F5C" },
  Gamerverse: { corBg: "#D6F5F0", corFg: "#0B5345" },
};

export const DEFAULT_OPTION_COLOR: ColorPair = { corBg: "#EFEFEF", corFg: "#3D3D3D" };

export const MARCA_IDENTIDADE = {
  primaria: "#ED1D24",
  grafite: "#202124",
  neutroClaro: "#F2F2F2",
  neutroMedio: "#D9D9D9",
};
