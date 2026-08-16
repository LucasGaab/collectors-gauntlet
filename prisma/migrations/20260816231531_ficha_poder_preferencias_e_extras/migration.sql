-- AlterTable
ALTER TABLE "Figure" ADD COLUMN     "acessorios" INTEGER,
ADD COLUMN     "alturaCm" DOUBLE PRECISION,
ADD COLUMN     "articulacao" INTEGER,
ADD COLUMN     "conquistadaEm" TIMESTAMP(3),
ADD COLUMN     "corDominante" TEXT,
ADD COLUMN     "era" TEXT,
ADD COLUMN     "pintura" INTEGER,
ADD COLUMN     "prioridade" TEXT,
ADD COLUMN     "raridade" INTEGER,
ADD COLUMN     "rascunho" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "semelhanca" INTEGER;

-- AlterTable
ALTER TABLE "Grupo" ADD COLUMN     "icone" TEXT;

-- CreateTable
CREATE TABLE "Preferencias" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nomeColecao" TEXT,
    "tema" TEXT NOT NULL DEFAULT 'obsidian',
    "densidade" INTEGER NOT NULL DEFAULT 5,
    "orcamentoMensal" DOUBLE PRECISION,
    "graoPapel" BOOLEAN NOT NULL DEFAULT false,
    "somAmbiente" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preferencias_pkey" PRIMARY KEY ("id")
);
