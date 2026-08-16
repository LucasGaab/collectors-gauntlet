import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { EditableList, type EditableItem } from "@/components/EditableList";
import { createMarca, updateMarca, deleteMarca } from "@/lib/actions/marcas";
import { createGrupo, updateGrupo, deleteGrupo } from "@/lib/actions/grupos";
import { createOption, updateOption, deleteOption } from "@/lib/actions/options";
import { createConjunto, updateConjunto, deleteConjunto } from "@/lib/actions/conjuntos";
import { BackupPanel } from "@/components/BackupPanel";
import { Stagger, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function ListasPage() {
  const [marcas, grupos, conjuntos, options] = await Promise.all([
    prisma.marca.findMany({ orderBy: { ordem: "asc" } }),
    prisma.grupo.findMany({ orderBy: { ordem: "asc" } }),
    prisma.conjunto.findMany({ orderBy: { ordem: "asc" } }),
    prisma.option.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  const toItems = (
    arr: { id: string; corBg: string; corFg: string; meta?: number | null }[],
    labelKey: "nome" | "valor",
  ) =>
    arr.map((a) => ({
      id: a.id,
      label: (a as unknown as Record<string, string>)[labelKey],
      corBg: a.corBg,
      corFg: a.corFg,
      meta: a.meta ?? null,
    })) as EditableItem[];

  const byCategoria = (categoria: string) => options.filter((o) => o.categoria === categoria);

  const optionSections: { categoria: string; title: string }[] = [
    { categoria: "escala", title: "Escala" },
    { categoria: "estilo", title: "Estilo" },
    { categoria: "alinhamento", title: "Alinhamento" },
    { categoria: "tipo", title: "Tipo" },
    { categoria: "status", title: "Status" },
    { categoria: "faixaPreco", title: "Faixa de Preço" },
  ];

  return (
    <AppShell title="Listas auxiliares" subtitle="Valores e cores usados nas badges da coleção">
      <BackupPanel />

      <Stagger className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StaggerItem>
          <EditableList
            title="Marca"
            labelField="nome"
            labelPlaceholder="Nova marca"
            items={toItems(marcas, "nome")}
            onCreate={createMarca}
            onUpdate={updateMarca}
            onDelete={deleteMarca}
          />
        </StaggerItem>
        <StaggerItem>
          <EditableList
            title="Grupo"
            description="A meta define o total alvo do progresso no Dashboard. Vazia = usa o total já catalogado."
            labelField="nome"
            labelPlaceholder="Novo grupo"
            withMeta
            items={toItems(grupos, "nome")}
            onCreate={createGrupo}
            onUpdate={updateGrupo}
            onDelete={deleteGrupo}
          />
        </StaggerItem>
        <StaggerItem>
          <EditableList
            title="Conjuntos"
            description="Agrupamentos pessoais dentro da Coleção — uma figura pode estar em vários."
            labelField="nome"
            labelPlaceholder="Novo conjunto"
            withMeta
            items={toItems(conjuntos, "nome")}
            onCreate={createConjunto}
            onUpdate={updateConjunto}
            onDelete={deleteConjunto}
          />
        </StaggerItem>
        {optionSections.map((section) => (
          <StaggerItem key={section.categoria}>
            <EditableList
              title={section.title}
              labelField="valor"
              labelPlaceholder={`Novo valor de ${section.title.toLowerCase()}`}
              hiddenFields={{ categoria: section.categoria }}
              items={toItems(byCategoria(section.categoria), "valor")}
              onCreate={createOption}
              onUpdate={updateOption}
              onDelete={deleteOption}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </AppShell>
  );
}
