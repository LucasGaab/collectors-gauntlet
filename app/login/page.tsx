import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogoHorizontal } from "@/components/LogoMark";
import { LoginForm } from "@/components/LoginForm";
import { lerSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar — Collector's Gauntlet",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Quem já tem sessão válida não vê a tela de login.
  if (await lerSessao()) redirect("/");

  return (
    // Altura travada no viewport, pra tela não rolar.
    //
    // A altura vai no `style`, não numa classe: `h-dvh` não é gerada pelo
    // Tailwind aqui (conferido — a regra `.h-dvh` não existe no CSS compilado),
    // então virava um no-op silencioso e nada limitava a altura. `h-screen`
    // fica como piso em 100vh e o inline sobrepõe com `dvh`, que acompanha a
    // barra do navegador aparecendo e sumindo no celular.
    <main
      style={{ height: "100dvh" }}
      className="relative h-screen overflow-hidden bg-background text-foreground"
    >
      {/* Brilho carmim atrás de tudo, ancorado onde a manopla fica na arte. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 55% at 72% 42%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid h-full max-w-[1500px] grid-rows-[auto_minmax(0,1fr)] items-center gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,440px)_1fr] lg:grid-rows-1 lg:gap-10 lg:p-8">
        {/* ── Coluna do formulário ─────────────────────────────────────── */}
        {/* Válvula de escape: em telas muito baixas o formulário rola dentro da
            própria coluna, em vez de empurrar a página inteira. */}
        <section className="order-2 max-h-full overflow-y-auto no-scrollbar lg:order-1">
          <div className="painel-hq reticula relative rounded-none p-5 sm:p-8 lg:p-9">
            {/* Camada sólida por cima da retícula: os pontos ficam só na moldura. */}
            <div aria-hidden className="absolute inset-3 bg-surface" />

            <div className="relative">
              <LogoHorizontal className="h-auto w-full max-w-[230px]" />

              <h1 className="display-title mt-5 text-2xl leading-none sm:mt-7 sm:text-4xl">
                O acervo está
                <span className="block text-primary">trancado.</span>
              </h1>
              <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-muted-foreground min-[720px]:block">
                Só quem tem a manopla abre a estante. Entre para gerenciar a coleção — a{" "}
                <a href="/vitrine" className="text-gold underline-offset-2 hover:underline">
                  vitrine pública
                </a>{" "}
                segue aberta a quem você convidar.
              </p>

              <div className="mt-6 sm:mt-8">
                <LoginForm />
              </div>
            </div>
          </div>

          <p className="mt-5 px-2 text-center text-[10px] leading-relaxed text-muted-foreground/70">
            Projeto pessoal de fã. Sem afiliação com Marvel, Disney ou fabricantes de action
            figures.
          </p>
        </section>

        {/* ── Coluna da arte ───────────────────────────────────────────── */}
        <section className="order-1 min-h-0 lg:order-2 lg:h-full">
          {/* A arte preenche a altura disponível em vez de ditar a altura por
              aspect-ratio — era isso que fazia a página estourar o viewport. */}
          <div className="painel-hq relative h-[22vh] w-full overflow-hidden sm:h-[30vh] lg:h-full">
            <Image
              src="/login-arte.webp"
              alt="O Guardião do acervo, erguendo a manopla"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              // A cabeça do Guardião fica no topo da arte: ancorar o recorte no
              // centro (padrão) cortava o rosto. `top` mantém o rosto sempre visível.
              className="object-cover object-[62%_top]"
            />

            {/* Vinheta: costura a arte com o fundo do app e segura a legenda. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(17,17,19,0.85) 0%, rgba(17,17,19,0.1) 35%, rgba(17,17,19,0) 60%), linear-gradient(0deg, rgba(17,17,19,0.9) 0%, rgba(17,17,19,0) 42%)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 hidden p-5 sm:block sm:p-7">
              <p className="caption-box mb-2">Edição #001</p>
              <p className="display-title text-xl leading-none text-white sm:text-2xl">
                O Guardião do Acervo
              </p>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-white/60">
                Personagem original. Nenhuma peça sai da estante sem passar por ele.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
