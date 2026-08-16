/**
 * Chave de sessionStorage com a ordem das peças atualmente listadas.
 *
 * A listagem publica essa ordem e o modal de detalhe consome pra navegar com
 * ← →. É sessionStorage (e não a URL) porque o modal é uma intercepting route:
 * ele não tem acesso aos filtros/ordenação da tela que o abriu.
 */
export const NAV_IDS_STORAGE_KEY = "gauntlet-nav-ids";

export function readNavIds(): string[] {
  try {
    const raw = sessionStorage.getItem(NAV_IDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
