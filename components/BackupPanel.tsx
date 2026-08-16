"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { importFiguresCsv, type ImportResult } from "@/lib/actions/import";
import { useToast } from "@/components/Toast";

/**
 * Backup e edição em massa via planilha. O CSV exportado é o mesmo formato
 * aceito na importação, então o ciclo exportar → editar no Excel → importar
 * funciona sem conversão manual.
 */
export function BackupPanel() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("arquivo") as File | null;
    if (!file || file.size === 0) {
      showToast("Escolha um arquivo CSV primeiro.", "error");
      return;
    }

    startTransition(async () => {
      const res = await importFiguresCsv(formData);
      setResult(res);
      formRef.current?.reset();
      const total = res.created + res.updated;
      if (total > 0) showToast(`${total} peça${total === 1 ? "" : "s"} importada${total === 1 ? "" : "s"}.`);
      else showToast("Nada foi importado — veja o relatório.", "error");
    });
  }

  return (
    <div className="glass-card rounded-2xl border border-border p-6">
      <h2 className="display-title text-lg">Backup / CSV</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Exporte a coleção pra planilha, edite em massa e importe de volta. Linhas com um{" "}
        <code className="text-foreground">id</code> existente atualizam a peça; sem{" "}
        <code className="text-foreground">id</code>, criam uma nova.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href="/api/figuras/export"
          download
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Download className="size-3.5" /> Exportar CSV
        </a>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="arquivo"
            accept=".csv,text/csv"
            className="max-w-64 text-xs text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-surface file:px-4 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-foreground"
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-full border border-border px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
          >
            <Upload className="size-3.5" /> {isPending ? "Importando..." : "Importar"}
          </button>
        </form>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-foreground">
            <strong>{result.created}</strong> criada(s) · <strong>{result.updated}</strong>{" "}
            atualizada(s) · <strong>{result.skipped}</strong> ignorada(s)
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
              {result.errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
