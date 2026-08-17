"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Presentation,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export type PecaVitrine = {
  id: string;
  nome: string;
  personagem: string;
  linha: string | null;
  status: string;
  imagemUrl: string | null;
  thumbUrl: string | null;
  marca: { nome: string; corBg: string; corFg: string };
  grupo: { nome: string; corBg: string; corFg: string };
};

const INTERVALO_SLIDE = 4500;

/** Preferência de som por aparelho (item 33) — sobrepõe o padrão do banco. */
const SOM_STORAGE_KEY = "gauntlet-vitrine-som";

/**
 * Galeria pública somente-leitura. Não importa nenhuma server action de escrita
 * — não há caminho de edição a partir daqui, nem escondido.
 */
export function Vitrine({ pecas, somAmbiente = false }: { pecas: PecaVitrine[]; somAmbiente?: boolean }) {
  const [indice, setIndice] = useState<number | null>(null);
  const [apresentando, setApresentando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [som, setSom] = useState(somAmbiente);
  const audioRef = useRef<AudioContext | null>(null);

  const aberta = indice !== null;

  // O valor salvo em Preferências é só o padrão; quem manda neste aparelho é a
  // última escolha feita aqui (localStorage não existe no SSR, daí o efeito).
  useEffect(() => {
    const salvo = localStorage.getItem(SOM_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo !== null) setSom(salvo === "1");
  }, []);

  useEffect(() => {
    return () => {
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  /**
   * Clique curto de vitrine, sintetizado em vez de carregado: um arquivo de
   * áudio custaria uma requisição e um asset no repositório por um "tec" de
   * 120ms. Falha em silêncio onde não há WebAudio.
   */
  const tocarClique = useCallback(() => {
    if (!som) return;
    try {
      const ctx = (audioRef.current ??= new AudioContext());
      if (ctx.state === "suspended") void ctx.resume();

      const agora = ctx.currentTime;
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1250, agora);
      osc.frequency.exponentialRampToValueAtTime(340, agora + 0.06);
      ganho.gain.setValueAtTime(0.0001, agora);
      ganho.gain.exponentialRampToValueAtTime(0.05, agora + 0.006);
      ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.12);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(agora);
      osc.stop(agora + 0.14);
    } catch {
      // Sem áudio disponível: a apresentação segue muda.
    }
  }, [som]);

  function alternarSom() {
    setSom((v) => {
      const proximo = !v;
      localStorage.setItem(SOM_STORAGE_KEY, proximo ? "1" : "0");
      return proximo;
    });
  }

  const irPara = useCallback(
    (delta: number) => {
      setIndice((i) => (i === null ? null : (i + delta + pecas.length) % pecas.length));
      // O clique é do modo apresentação; navegar peça a peça na lupa é mudo.
      if (apresentando) tocarClique();
    },
    [pecas.length, apresentando, tocarClique],
  );

  const fechar = useCallback(() => {
    setIndice(null);
    setApresentando(false);
    setPausado(false);
  }, []);

  // Avanço automático no modo apresentação.
  useEffect(() => {
    if (!apresentando || pausado || !aberta) return;
    const t = setTimeout(() => irPara(1), INTERVALO_SLIDE);
    return () => clearTimeout(t);
  }, [apresentando, pausado, aberta, indice, irPara]);

  useEffect(() => {
    if (!aberta) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
      else if (e.key === "ArrowRight") irPara(1);
      else if (e.key === "ArrowLeft") irPara(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPausado((p) => !p);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [aberta, fechar, irPara]);

  function apresentar() {
    if (pecas.length === 0) return;
    setIndice(0);
    setApresentando(true);
    setPausado(false);
    // Primeiro clique dentro do gesto do usuário: é ele que destrava o áudio
    // no navegador, sem isso o som só sairia a partir da segunda peça.
    tocarClique();
  }

  const atual = indice !== null ? pecas[indice] : null;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {pecas.length} peça{pecas.length === 1 ? "" : "s"} em exposição
        </p>
        <button
          type="button"
          onClick={apresentar}
          disabled={pecas.length === 0}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 hover:bg-primary-hover disabled:opacity-40"
        >
          <Presentation className="size-3.5" /> Apresentar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {pecas.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setIndice(i)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
            className="vitrine-spot group relative overflow-hidden rounded-xl border border-border bg-surface text-left transition-transform duration-300 hover:-translate-y-1"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
            }}
          >
            {/*
              Morph de elemento compartilhado: a miniatura cresce e vira a foto
              em tela cheia. O layoutId sai do card enquanto ele é o item aberto
              — dois elementos com o mesmo id simultaneamente quebrariam o morph.
            */}
            <motion.div
              layoutId={indice === i ? undefined : `foto-${p.id}`}
              className="relative aspect-square w-full"
            >
              {p.thumbUrl ?? p.imagemUrl ? (
                <Image
                  src={(p.thumbUrl ?? p.imagemUrl)!}
                  alt={p.nome}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder />
              )}
            </motion.div>
            <div className="p-3">
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {p.marca.nome}
              </p>
              <h3 className="display-title mt-1 truncate text-sm leading-tight transition-colors group-hover:text-primary">
                {p.nome}
              </h3>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {atual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {indice! + 1} / {pecas.length}
              </span>
              <div className="flex items-center gap-2">
                {apresentando && (
                  <button
                    type="button"
                    onClick={alternarSom}
                    aria-pressed={som}
                    aria-label={som ? "Desligar som" : "Ligar som"}
                    title={som ? "Desligar som" : "Ligar som"}
                    className={`grid size-9 place-items-center rounded-full border border-white/20 transition-colors hover:text-primary ${
                      som ? "text-white" : "text-white/40"
                    }`}
                  >
                    {som ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  </button>
                )}
                {apresentando && (
                  <button
                    type="button"
                    onClick={() => setPausado((p) => !p)}
                    aria-label={pausado ? "Retomar" : "Pausar"}
                    className="grid size-9 place-items-center rounded-full border border-white/20 text-white transition-colors hover:text-primary"
                  >
                    {pausado ? <Play className="size-4" /> : <Pause className="size-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="grid size-9 place-items-center rounded-full border border-white/20 text-white transition-colors hover:text-primary"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={atual.id}
                  layoutId={`foto-${atual.id}`}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative h-full w-full max-w-3xl"
                >
                  {atual.imagemUrl ? (
                    <Image
                      src={atual.imagemUrl}
                      alt={atual.nome}
                      fill
                      sizes="100vw"
                      unoptimized
                      priority
                      className="object-contain"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <ImagePlaceholder />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => irPara(-1)}
                aria-label="Anterior"
                className="absolute left-2 grid size-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:text-primary"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => irPara(1)}
                aria-label="Próxima"
                className="absolute right-2 grid size-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:text-primary"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <motion.div
              key={`${atual.id}-info`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="p-6 text-center"
            >
              <h2 className="display-title text-2xl text-white sm:text-3xl">{atual.nome}</h2>
              <p className="mt-1 text-sm text-white/60">
                {atual.personagem}
                {atual.linha ? ` · ${atual.linha}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge label={atual.marca.nome} corBg={atual.marca.corBg} corFg={atual.marca.corFg} />
                <Badge label={atual.grupo.nome} corBg={atual.grupo.corBg} corFg={atual.grupo.corFg} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
