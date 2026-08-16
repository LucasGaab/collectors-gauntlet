"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import type { Figure, Marca, Grupo, Conjunto, Option } from "@prisma/client";
import { Badge } from "@/components/Badge";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { DuplicateWarning } from "@/components/DuplicateWarning";
import { CamposFichaPoder } from "@/components/FichaPoder";

type OptionLite = Pick<Option, "id" | "valor" | "corBg" | "corFg">;
type MarcaLite = Pick<Marca, "id" | "nome">;
type GrupoLite = Pick<Grupo, "id" | "nome">;
type ConjuntoLite = Pick<Conjunto, "id" | "nome" | "corBg" | "corFg">;

export type FigureFormLists = {
  marcas: MarcaLite[];
  grupos: GrupoLite[];
  conjuntos: ConjuntoLite[];
  escalas: OptionLite[];
  estilos: OptionLite[];
  alinhamentos: OptionLite[];
  tipos: OptionLite[];
  statuses: OptionLite[];
  faixasPreco: OptionLite[];
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  lists: FigureFormLists;
  initialData?: (Figure & { conjuntos?: { id: string }[] }) | null;
  onCancel?: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60";

const toDateInput = (d: Date | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function FigureForm({ action, lists, initialData, onCancel }: Props) {
  const [preview, setPreview] = useState<string | null>(initialData?.imagemUrl ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [conjuntoIds, setConjuntoIds] = useState<string[]>(
    initialData?.conjuntos?.map((c) => c.id) ?? [],
  );
  const [precoConferidoEm, setPrecoConferidoEm] = useState(
    toDateInput(initialData?.precoConferidoEm),
  );
  const [nome, setNome] = useState(initialData?.nome ?? "");
  const [personagem, setPersonagem] = useState(initialData?.personagem ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  // A checagem de duplicata só faz sentido no cadastro de peça nova.
  const isCreating = !initialData;

  function toggleConjunto(id: string) {
    setConjuntoIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setRemoveImage(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFile(file);
    }
  }

  function clearImage() {
    setPreview(null);
    if (initialData?.imagemUrl) setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,300px)_1fr]">
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors duration-200 ${
            dragOver ? "border-primary" : "border-border"
          }`}
        >
          {preview && !removeImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pré-visualização" className="size-full object-cover" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:text-primary"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="group size-full">
              <ImagePlaceholder />
              <span className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-muted-foreground">
                <UploadCloud className="size-5 transition-colors group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Arraste a imagem ou clique
                </span>
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            name="imagem"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {removeImage && <input type="hidden" name="removerImagem" value="on" />}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          A foto é a protagonista — use uma imagem vertical de boa resolução.
        </p>
      </div>

      <div className="glass-card space-y-6 rounded-2xl border border-border p-8">
        {isCreating && <DuplicateWarning nome={nome} personagem={personagem} />}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Nome da peça">
            <input
              name="nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
              placeholder="Ex: Mafex 143 - Spider-Man (Ben Reilly)"
            />
          </Field>
          <Field label="Personagem">
            <input
              name="personagem"
              required
              value={personagem}
              onChange={(e) => setPersonagem(e.target.value)}
              className={inputClass}
              placeholder="Ex: Peter Parker (Ben Reilly)"
            />
          </Field>
          <Field label="Linha / Série">
            <input
              name="linha"
              defaultValue={initialData?.linha ?? ""}
              className={inputClass}
              placeholder="Ex: Spider-Man: The Clone Saga"
            />
          </Field>
          <Field label="Preço estimado (R$)">
            <input
              type="number"
              step="0.01"
              min="0"
              name="precoEstimado"
              defaultValue={initialData?.precoEstimado ?? ""}
              className={inputClass}
              placeholder="Ex: 350.00"
            />
          </Field>
          <Field label="Preço conferido em">
            <div className="flex gap-2">
              <input
                type="date"
                name="precoConferidoEm"
                value={precoConferidoEm}
                onChange={(e) => setPrecoConferidoEm(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setPrecoConferidoEm(today)}
                title="Marcar como conferido hoje"
                className="shrink-0 rounded-lg border border-border px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                Hoje
              </button>
            </div>
          </Field>

          <Field label="Marca">
            <select name="marcaId" required defaultValue={initialData?.marcaId} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grupo">
            <select name="grupoId" required defaultValue={initialData?.grupoId} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Escala">
            <select name="escala" required defaultValue={initialData?.escala} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.escalas.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estilo">
            <select name="estilo" required defaultValue={initialData?.estilo} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.estilos.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alinhamento">
            <select
              name="alinhamento"
              required
              defaultValue={initialData?.alinhamento}
              className={inputClass}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {lists.alinhamentos.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select name="tipo" required defaultValue={initialData?.tipo} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.tipos.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" required defaultValue={initialData?.status} className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {lists.statuses.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Faixa de preço">
            <select
              name="faixaPreco"
              required
              defaultValue={initialData?.faixaPreco}
              className={inputClass}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {lists.faixasPreco.map((o) => (
                <option key={o.id} value={o.valor}>
                  {o.valor}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {lists.conjuntos.length > 0 && (
          <Field label="Conjuntos">
            <div className="flex flex-wrap gap-2">
              {lists.conjuntos.map((c) => {
                const on = conjuntoIds.includes(c.id);
                return (
                  <span key={c.id} className="inline-block">
                    <input type="checkbox" name="conjuntoIds" value={c.id} checked={on} readOnly hidden />
                    <button
                      type="button"
                      onClick={() => toggleConjunto(c.id)}
                      className={`rounded-full p-0.5 transition-all duration-200 ${
                        on ? "ring-2 ring-primary" : "opacity-50 hover:opacity-100"
                      }`}
                    >
                      <Badge label={c.nome} corBg={c.corBg} corFg={c.corFg} size="md" />
                    </button>
                  </span>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Link da loja">
          <input
            type="url"
            name="link"
            defaultValue={initialData?.link ?? ""}
            className={inputClass}
            placeholder="https://..."
          />
        </Field>

        <div className="border-t border-border pt-6">
          <p className="caption-box mb-4">Ficha de Poder</p>
          <CamposFichaPoder
            initial={{
              articulacao: initialData?.articulacao ?? null,
              pintura: initialData?.pintura ?? null,
              acessorios: initialData?.acessorios ?? null,
              semelhanca: initialData?.semelhanca ?? null,
              raridade: initialData?.raridade ?? null,
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Notas de 1 a 7. Deixe vazio o que ainda não quiser avaliar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Prioridade (wishlist)">
            <select name="prioridade" defaultValue={initialData?.prioridade ?? ""} className={inputClass}>
              <option value="">Sem prioridade</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </Field>
          <Field label="Era">
            <select name="era" defaultValue={initialData?.era ?? ""} className={inputClass}>
              <option value="">Não definida</option>
              <option value="Ouro">Ouro</option>
              <option value="Prata">Prata</option>
              <option value="Bronze">Bronze</option>
              <option value="Moderna">Moderna</option>
            </select>
          </Field>
          <Field label="Altura (cm)">
            <input
              type="number"
              step="0.1"
              min="0"
              name="alturaCm"
              defaultValue={initialData?.alturaCm ?? ""}
              placeholder="Ex: 16"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea
            name="observacoes"
            defaultValue={initialData?.observacoes ?? ""}
            rows={4}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="rounded-full bg-primary px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary-hover"
          >
            {initialData ? "Salvar alterações" : "Salvar peça"}
          </button>
        </div>
      </div>
    </form>
  );
}
