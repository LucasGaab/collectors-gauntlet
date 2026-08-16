/**
 * Lê as listas auxiliares (Marca, Grupo, Conjunto, Option) direto do SQLite
 * legado e imprime como JSON, para reimportar no Postgres.
 *
 *   npx tsx scripts/exportar-listas-sqlite.ts prisma/dev.db > listas.json
 *
 * Usa `node:sqlite` (embutido no Node) porque o Prisma Client já está gerado
 * para Postgres e não consegue mais abrir o arquivo antigo. Script de migração
 * pontual — pode ser apagado depois que a transição terminar.
 */
import { DatabaseSync } from "node:sqlite";

const file = process.argv[2] ?? "prisma/dev.db";
const db = new DatabaseSync(file, { readOnly: true });

const dump = {
  marcas: db.prepare(`SELECT nome, corBg, corFg, ordem FROM Marca ORDER BY ordem`).all(),
  grupos: db.prepare(`SELECT nome, corBg, corFg, ordem FROM Grupo ORDER BY ordem`).all(),
  conjuntos: db.prepare(`SELECT nome, corBg, corFg, ordem FROM Conjunto ORDER BY ordem`).all(),
  options: db
    .prepare(`SELECT categoria, valor, corBg, corFg, ordem FROM "Option" ORDER BY categoria, ordem`)
    .all(),
};

console.log(JSON.stringify(dump, null, 2));
db.close();
