import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serve as fotos guardadas na tabela `Imagem`.
 *
 * O conteúdo de um id nunca muda (novo upload gera uma linha nova), então o
 * cache pode ser `immutable` e agressivo — é o que evita bater no banco a cada
 * scroll da grade.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const imagem = await prisma.imagem.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });

  if (!imagem) return new Response("Imagem não encontrada", { status: 404 });

  return new Response(new Uint8Array(imagem.data), {
    headers: {
      "Content-Type": imagem.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(imagem.data.length),
    },
  });
}
