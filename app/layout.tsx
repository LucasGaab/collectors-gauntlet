import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import { ToastProvider } from "@/components/Toast";
import { getPreferencias } from "@/lib/preferencias";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collector's Gauntlet",
  description:
    "Controle pessoal de coleção de action figures — projeto de fã, sem afiliação com Marvel/Disney",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gauntlet" },
};

// Pinta a barra do navegador/sistema com a cor de fundo do app no mobile.
export const viewport: Viewport = {
  themeColor: "#111113",
  // Evita zoom acidental por duplo-toque nos cards, sem bloquear pinch-zoom.
  initialScale: 1,
  width: "device-width",
};

type Props = {
  children: React.ReactNode;
  modal: React.ReactNode;
};

export default async function RootLayout({ children, modal }: Props) {
  // Tema e grão vêm do servidor e já saem no HTML — sem piscar de tema errado
  // na primeira pintura, que aconteceria se fossem aplicados no cliente.
  const prefs = await getPreferencias();

  return (
    <html
      lang="pt-BR"
      data-tema={prefs.tema}
      data-grao={prefs.graoPapel ? "1" : "0"}
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <ToastProvider>
          {children}
          <AnimatePresence>{modal}</AnimatePresence>
        </ToastProvider>
      </body>
    </html>
  );
}
