-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Imagem" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Imagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Figure" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "personagem" TEXT NOT NULL,
    "linha" TEXT,
    "escala" TEXT NOT NULL,
    "estilo" TEXT NOT NULL,
    "alinhamento" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "precoEstimado" DOUBLE PRECISION,
    "faixaPreco" TEXT NOT NULL,
    "link" TEXT,
    "imagemUrl" TEXT,
    "thumbUrl" TEXT,
    "observacoes" TEXT,
    "precoConferidoEm" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "marcaId" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Figure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corBg" TEXT NOT NULL,
    "corFg" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corBg" TEXT NOT NULL,
    "corFg" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conjunto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corBg" TEXT NOT NULL,
    "corFg" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Conjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "corBg" TEXT NOT NULL,
    "corFg" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConjuntoToFigure" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConjuntoToFigure_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nome_key" ON "Marca"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_nome_key" ON "Grupo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Conjunto_nome_key" ON "Conjunto"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Option_categoria_valor_key" ON "Option"("categoria", "valor");

-- CreateIndex
CREATE INDEX "_ConjuntoToFigure_B_index" ON "_ConjuntoToFigure"("B");

-- AddForeignKey
ALTER TABLE "Figure" ADD CONSTRAINT "Figure_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Figure" ADD CONSTRAINT "Figure_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConjuntoToFigure" ADD CONSTRAINT "_ConjuntoToFigure_A_fkey" FOREIGN KEY ("A") REFERENCES "Conjunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConjuntoToFigure" ADD CONSTRAINT "_ConjuntoToFigure_B_fkey" FOREIGN KEY ("B") REFERENCES "Figure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

