"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, LoaderCircle, LogIn } from "lucide-react";
import { entrar, type EstadoLogin } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-lg border-2 border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary";

export function LoginForm() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="space-y-5">
      <label className="block">
        <span className="caption-box mb-2">Usuário</span>
        <input
          name="login"
          autoComplete="username"
          autoFocus
          required
          disabled={pendente}
          placeholder="seu usuário"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="caption-box mb-2">Senha</span>
        <input
          type="password"
          name="senha"
          autoComplete="current-password"
          required
          disabled={pendente}
          placeholder="sua senha"
          className={inputClass}
        />
      </label>

      {estado.erro && (
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
          transition={{ duration: 0.35 }}
          role="alert"
          className="flex items-center gap-2 rounded-lg border-2 border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          {estado.erro}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="group flex w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-[4px_4px_0_#000] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-[2px_2px_0_#000] disabled:opacity-60"
      >
        {pendente ? (
          <>
            <LoaderCircle className="size-4 animate-spin" /> Entrando...
          </>
        ) : (
          <>
            <LogIn className="size-4 transition-transform group-hover:translate-x-0.5" /> Entrar
          </>
        )}
      </button>

      <p className="pt-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        A sessão fica ativa por 3 dias, renovada enquanto você usa
      </p>
    </form>
  );
}
