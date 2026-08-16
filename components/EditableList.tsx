"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";

export type EditableItem = {
  id: string;
  label: string;
  corBg: string;
  corFg: string;
};

type Props = {
  title: string;
  description?: string;
  items: EditableItem[];
  labelField: string;
  labelPlaceholder?: string;
  hiddenFields?: Record<string, string>;
  onCreate: (formData: FormData) => Promise<void>;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<{ error?: string }>;
};

const DEFAULT_BG = "#2B2B36";
const DEFAULT_FG = "#F5F5F7";

export function EditableList({
  title,
  description,
  items,
  labelField,
  labelPlaceholder,
  hiddenFields,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const { showToast } = useToast();
  const [overrides, setOverrides] = useState<Record<string, Partial<EditableItem>>>({});
  const [newLabel, setNewLabel] = useState("");
  const [newBg, setNewBg] = useState(DEFAULT_BG);
  const [newFg, setNewFg] = useState(DEFAULT_FG);
  const [isPending, startTransition] = useTransition();

  function displayItem(item: EditableItem): EditableItem {
    return { ...item, ...overrides[item.id] };
  }

  function buildFormData(label: string, corBg: string, corFg: string) {
    const fd = new FormData();
    fd.set(labelField, label);
    fd.set("corBg", corBg);
    fd.set("corFg", corFg);
    if (hiddenFields) {
      for (const [k, v] of Object.entries(hiddenFields)) fd.set(k, v);
    }
    return fd;
  }

  function patchRow(id: string, patch: Partial<EditableItem>) {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function commit(item: EditableItem) {
    const merged = displayItem(item);
    startTransition(async () => {
      await onUpdate(item.id, buildFormData(merged.label.trim(), merged.corBg, merged.corFg));
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    });
  }

  function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    startTransition(async () => {
      await onCreate(buildFormData(newLabel.trim(), newBg, newFg));
      showToast("Valor adicionado");
      setNewLabel("");
      setNewBg(DEFAULT_BG);
      setNewFg(DEFAULT_FG);
    });
  }

  function remover(item: EditableItem) {
    if (!confirm(`Remover "${item.label}"?`)) return;
    startTransition(async () => {
      const result = await onDelete(item.id);
      if (result.error) showToast(result.error, "error");
      else showToast("Valor removido");
    });
  }

  return (
    <div className="glass-card rounded-2xl border border-border p-6">
      <p className="eyebrow mb-1">{title}</p>
      {description && <p className="mb-4 text-xs text-muted-foreground">{description}</p>}

      <div className="space-y-2">
        {items.map((raw) => {
          const item = displayItem(raw);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 transition-colors hover:bg-surface-high"
            >
              <input
                value={item.label}
                onChange={(e) => patchRow(item.id, { label: e.target.value })}
                onBlur={() => commit(item)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <Badge label={item.label} corBg={item.corBg} corFg={item.corFg} />
              <input
                type="color"
                value={item.corBg}
                onChange={(e) => patchRow(item.id, { corBg: e.target.value })}
                onBlur={() => commit(item)}
                className="size-6 cursor-pointer rounded border border-border bg-transparent"
                aria-label="Cor de fundo"
              />
              <input
                type="color"
                value={item.corFg}
                onChange={(e) => patchRow(item.id, { corFg: e.target.value })}
                onBlur={() => commit(item)}
                className="size-6 cursor-pointer rounded border border-border bg-transparent"
                aria-label="Cor do texto"
              />
              <button
                type="button"
                onClick={() => remover(item)}
                disabled={isPending}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>}
      </div>

      <form onSubmit={criar} className="mt-5 flex items-center gap-2 border-t border-border pt-5">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={labelPlaceholder ?? "Novo valor"}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <input
          type="color"
          value={newBg}
          onChange={(e) => setNewBg(e.target.value)}
          className="size-8 cursor-pointer rounded border border-border bg-transparent"
          aria-label="Cor de fundo do novo valor"
        />
        <input
          type="color"
          value={newFg}
          onChange={(e) => setNewFg(e.target.value)}
          className="size-8 cursor-pointer rounded border border-border bg-transparent"
          aria-label="Cor do texto do novo valor"
        />
        <button
          type="submit"
          disabled={isPending}
          className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </div>
  );
}
