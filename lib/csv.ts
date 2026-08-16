/**
 * CSV mínimo no estilo RFC 4180 (aspas duplas, `""` como escape), suficiente
 * pro round-trip de backup/edição em planilha. Sem dependência externa.
 */

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

function escapeCell(value: string): string {
  const v = value ?? "";
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function parseCsv(text: string): string[][] {
  // Remove BOM que o Excel costuma gravar.
  const input = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  // Última célula/linha (arquivo sem quebra final).
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Ordem das colunas do arquivo exportado — também aceita na importação. */
export const CSV_COLUMNS = [
  "id",
  "nome",
  "personagem",
  "linha",
  "marca",
  "grupo",
  "conjuntos",
  "escala",
  "estilo",
  "alinhamento",
  "tipo",
  "status",
  "precoEstimado",
  "faixaPreco",
  "precoConferidoEm",
  "link",
  "imagemUrl",
  "thumbUrl",
  "observacoes",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Converte linhas em objetos usando o cabeçalho do próprio arquivo. */
export function rowsToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const rec: Record<string, string> = {};
    header.forEach((key, i) => {
      rec[key] = (row[i] ?? "").trim();
    });
    return rec;
  });
}
