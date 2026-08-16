"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

/**
 * Zoom da foto da peça. Renderiza num portal no <body> pra escapar do
 * `overflow-hidden` do modal de detalhe — assim funciona igual na página cheia
 * e dentro do modal interceptado.
 */
export function Lightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Impede que o modal de detalhe também feche com o mesmo Esc.
        e.stopPropagation();
        setOpen(false);
      }
      // Enquanto o zoom está aberto, ← → não devem trocar de peça.
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto de ${alt}`}
        className="group absolute inset-0 z-10 cursor-zoom-in"
      >
        <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </span>
      </button>

      {/* No SSR não existe `document`; o portal só é criado no cliente. Com o
          zoom fechado ele não renderiza nada, então não há divergência de
          hidratação. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative h-full w-full"
                >
                  <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
                </motion.div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar zoom"
                  className="fixed right-6 top-6 grid size-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:text-primary"
                >
                  <X className="size-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
