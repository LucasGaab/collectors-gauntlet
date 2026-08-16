import type { MetadataRoute } from "next";

/**
 * Manifest do PWA: permite "Adicionar à tela de início" e abrir em tela cheia,
 * sem a barra do navegador. Os ícones são gerados por scripts/gerar-icones.ts.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collector's Gauntlet",
    short_name: "Gauntlet",
    description: "Controle pessoal de coleção de action figures",
    start_url: "/",
    display: "standalone",
    background_color: "#111113",
    theme_color: "#111113",
    orientation: "portrait-primary",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
