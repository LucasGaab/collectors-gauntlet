-- CreateTable
CREATE TABLE "Conjunto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "corBg" TEXT NOT NULL,
    "corFg" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "_ConjuntoToFigure" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConjuntoToFigure_A_fkey" FOREIGN KEY ("A") REFERENCES "Conjunto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConjuntoToFigure_B_fkey" FOREIGN KEY ("B") REFERENCES "Figure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Conjunto_nome_key" ON "Conjunto"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "_ConjuntoToFigure_AB_unique" ON "_ConjuntoToFigure"("A", "B");

-- CreateIndex
CREATE INDEX "_ConjuntoToFigure_B_index" ON "_ConjuntoToFigure"("B");
