import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildOptionColorMap, getFilterOptions, NOT_DELETED } from "@/lib/queries";
import { FigureDetail } from "@/components/FigureDetail";
import { Modal } from "@/components/Modal";

export const dynamic = "force-dynamic";

/**
 * INVARIANTE: `/figuras/*` é um espaço reservado exclusivamente para IDs de figura.
 *
 * Esta rota interceptadora casa com QUALQUER `/figuras/<segmento>` numa navegação
 * client-side — inclusive segmentos estáticos. Um irmão estático (ex: o antigo
 * `/figuras/nova`) era capturado aqui como `id = "nova"`, o `findUnique` retornava
 * null e o `notFound()` derrubava a página inteira em 404, enquanto o servidor
 * respondia 200 (por isso o F5 sempre funcionava: hard navigation não intercepta).
 *
 * Por isso a tela de cadastro mora em `/nova`, fora deste namespace. Não crie
 * segmentos estáticos sob `/figuras/`.
 */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function FiguraModalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit } = await searchParams;

  const [figure, lists] = await Promise.all([
    prisma.figure.findFirst({
      where: { id, ...NOT_DELETED },
      include: { marca: true, grupo: true, conjuntos: true },
    }),
    getFilterOptions(),
  ]);

  if (!figure) notFound();

  const optionColors = buildOptionColorMap(lists.allOptions);

  return (
    <Modal currentId={figure.id}>
      <FigureDetail
        figure={figure}
        lists={lists}
        optionColors={optionColors}
        initialMode={edit ? "edit" : "view"}
        isModal
      />
    </Modal>
  );
}
