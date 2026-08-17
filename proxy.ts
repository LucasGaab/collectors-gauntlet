import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/authShared";

/**
 * Guard de rotas. No Next 16 este arquivo se chama `proxy.ts` — o antigo
 * `middleware.ts` foi renomeado, a função é a mesma.
 *
 * Aqui a checagem é **otimista**: só confere se o cookie existe. A validação de
 * verdade (token existe, não expirou) acontece em `exigirSessao()`, no servidor,
 * porque o proxy roda antes de tudo e consultar o banco a cada request sairia
 * caro. Um cookie forjado passa por aqui e morre na página seguinte.
 */

/** Rotas abertas: a vitrine é feita pra ser compartilhada com visitantes. */
const PUBLICAS = ["/login", "/vitrine"];

/** A vitrine precisa das fotos, então o servidor de imagem também fica aberto. */
const PREFIXOS_PUBLICOS = ["/api/imagem/"];

function ehPublica(pathname: string): boolean {
  if (PUBLICAS.includes(pathname)) return true;
  return PREFIXOS_PUBLICOS.some((p) => pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (ehPublica(pathname)) return NextResponse.next();

  const temCookie = request.cookies.has(COOKIE_SESSAO);
  if (temCookie) return NextResponse.next();

  // Guarda o destino pra devolver o usuário onde ele estava depois do login.
  const destino = new URL("/login", request.url);
  if (pathname !== "/") destino.searchParams.set("de", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  /*
   * Fora do guard: assets do Next, o favicon, o manifest e os ícones do PWA —
   * bloquear esses só quebraria o carregamento da própria tela de login.
   */
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|manifest.webmanifest|icone-.*\\.png|cursor-manopla\\.png|login-arte\\.webp|logo-.*\\.svg).*)",
  ],
};
