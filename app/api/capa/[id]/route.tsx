import { ImageResponse } from "next/og";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { NOT_DELETED } from "@/lib/queries";

export const dynamic = "force-dynamic";

const LARGURA = 800;
const ALTURA = 1200;

/**
 * Capa de revista gerada (item 04): transforma a peça numa capa fictícia, com
 * número de edição, preço e código de barras. Serve pra compartilhar a peça
 * como imagem, em vez de mandar um print da ficha.
 *
 * O número da edição é derivado do id — determinístico, então a mesma peça tem
 * sempre a mesma "edição", o que faria sentido numa coleção de verdade.
 */
function numeroEdicao(id: string): number {
  let soma = 0;
  for (const c of id) soma = (soma * 31 + c.charCodeAt(0)) % 999;
  return soma + 1;
}

/**
 * O Satori (motor do next/og) decodifica PNG, JPEG e SVG — **não decodifica
 * WebP**, que é justamente o formato em que gravamos toda foto. Por isso a
 * imagem é lida direto da tabela e reconvertida para PNG em memória, embutida
 * como data URI. De quebra, evita uma ida HTTP do servidor para ele mesmo.
 */
async function fotoComoDataUri(imagemUrl: string | null): Promise<string | null> {
  const match = imagemUrl ? /^\/api\/imagem\/([^/?#]+)$/.exec(imagemUrl) : null;
  if (!match) return null;

  const imagem = await prisma.imagem.findUnique({
    where: { id: match[1] },
    select: { data: true },
  });
  if (!imagem) return null;

  const png = await sharp(Buffer.from(imagem.data))
    .resize(LARGURA, ALTURA, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();

  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const peca = await prisma.figure.findFirst({
    where: { id, ...NOT_DELETED },
    include: { marca: true, grupo: true },
  });
  if (!peca) return new Response("Peça não encontrada", { status: 404 });

  const foto = await fotoComoDataUri(peca.imagemUrl);

  const edicao = numeroEdicao(peca.id);
  const preco = peca.precoEstimado
    ? peca.precoEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
  const mesAno = new Date(peca.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: LARGURA,
          height: ALTURA,
          display: "flex",
          flexDirection: "column",
          background: "#111113",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            width={LARGURA}
            height={ALTURA}
            style={{ position: "absolute", top: 0, left: 0, width: LARGURA, height: ALTURA, objectFit: "cover" }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            // Satori não entende o atalho `inset`: sem top/left/width/height
            // explícitos o overlay tem tamanho zero e o degradê some sem erro.
            top: 0,
            left: 0,
            width: LARGURA,
            height: ALTURA,
            // O escurecimento da base precisa começar cedo e chegar quase opaco:
            // a arte da caixa costuma ter logo e texto próprios justamente aí,
            // e eles atravessavam o título da capa.
            background:
              "linear-gradient(180deg, rgba(17,17,19,0.92) 0%, rgba(17,17,19,0.30) 26%, rgba(17,17,19,0.12) 46%, rgba(17,17,19,0.80) 62%, rgba(17,17,19,0.97) 78%, rgba(17,17,19,0.99) 100%)",
            display: "flex",
          }}
        />

        {/* Cabeçalho: marca da "revista" e número da edição */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "44px 48px 0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#ED1D24",
                fontSize: 68,
                fontWeight: 900,
                letterSpacing: -2,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              Gauntlet
            </span>
            <span style={{ color: "#F5F5F7", fontSize: 20, letterSpacing: 6, marginTop: 6 }}>
              {peca.grupo.nome.toUpperCase()}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              color: "#E8C468",
            }}
          >
            <span style={{ fontSize: 42, fontWeight: 900 }}>#{edicao}</span>
            <span style={{ fontSize: 18, color: "#F5F5F7" }}>{preco}</span>
          </div>
        </div>

        {/* Rodapé: nome da peça e selo */}
        <div
          style={{
            position: "relative",
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "0 48px 44px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "#E8C468",
              color: "#1A1206",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: 3,
              padding: "8px 16px",
              border: "4px solid #000",
              marginBottom: 20,
            }}
          >
            COLLECTOR&apos;S ITEM
          </div>

          <span
            style={{
              color: "#F5F5F7",
              fontSize: 74,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: -2,
              textTransform: "uppercase",
            }}
          >
            {peca.nome.slice(0, 46)}
          </span>
          <span style={{ color: "#B9B9C2", fontSize: 26, marginTop: 14 }}>
            {peca.personagem} · {peca.marca.nome}
          </span>

          {/* Código de barras: barras de larguras variadas derivadas do id */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginTop: 34 }}>
            {Array.from({ length: 34 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: ((peca.id.charCodeAt(i % peca.id.length) + i) % 4) + 2,
                  height: 54,
                  background: "#F5F5F7",
                }}
              />
            ))}
            <span style={{ color: "#B9B9C2", fontSize: 16, marginLeft: 14 }}>{mesAno}</span>
          </div>
        </div>
      </div>
    ),
    { width: LARGURA, height: ALTURA },
  );
}
