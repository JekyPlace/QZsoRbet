import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { createEmbeddings } from "../src/services/embedding.api.js";

const SOURCE_DIR = resolve(
  process.env.CSV_SOURCE_DIR ?? "/Users/jacopo/Sources",
);
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "csv_documents";
const ROWS_PER_CHUNK = Number(process.env.CSV_ROWS_PER_CHUNK ?? 5);
const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 16);

type CsvChunk = {
  id: string;
  text: string;
  payload: {
    source: string;
    fileName: string;
    chunkIndex: number;
    rowStart: number;
    rowEnd: number;
  };
};

async function findCsvFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);

      if (entry.isDirectory()) return findCsvFiles(path);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
        return [path];
      }

      return [];
    }),
  );

  return files.flat();
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t"];

  return candidates.reduce((best, candidate) => {
    const matches = firstLine.split(candidate).length;
    return matches > firstLine.split(best).length ? candidate : best;
  }, ",");
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    /**/

    if (character === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(field.trim());

      if (row.some(Boolean)) rows.push(row);

      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function formatRow(headers: string[], row: string[]): string {
  return headers
    .map(
      (header, index) =>
        `${header || `column_${index + 1}`}: ${row[index] ?? ""}`,
    )
    .join("\n");
}

function deterministicUuid(value: string): string {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 32);
  const versioned = `${hash.slice(0, 12)}5${hash.slice(13, 16)}`;
  const variant = ((Number.parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);
  const normalized = `${versioned}${variant}${hash.slice(17)}`;

  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join("-");
}

function createChunks(filePath: string, rows: string[][]): CsvChunk[] {
  if (rows.length < 2) return [];

  const source = relative(SOURCE_DIR, filePath);
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const chunks: CsvChunk[] = [];

  for (let index = 0; index < dataRows.length; index += ROWS_PER_CHUNK) {
    const rowsInChunk = dataRows.slice(index, index + ROWS_PER_CHUNK);
    const chunkIndex = chunks.length;
    const rowStart = index + 2;
    const rowEnd = index + rowsInChunk.length + 1;
    const text = [
      `Source CSV: ${source}`,
      `Rows: ${rowStart}-${rowEnd}`,
      "",
      ...rowsInChunk.map((row) => formatRow(headers, row)),
    ].join("\n\n");

    chunks.push({
      id: deterministicUuid(`${source}:${chunkIndex}`),
      text,
      payload: {
        source,
        fileName: basename(filePath),
        chunkIndex,
        rowStart,
        rowEnd,
      },
    });
  }

  return chunks;
}

async function ensureCollection(vectorSize: number): Promise<void> {
  const currentCollection = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}`,
  );

  if (currentCollection.ok) return;
  if (currentCollection.status !== 404) {
    throw new Error(`Qdrant error: ${await currentCollection.text()}`);
  }

  const response = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to create Qdrant collection: ${await response.text()}`,
    );
  }
}

async function deleteSourcePoints(source: string): Promise<void> {
  const response = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/delete?wait=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "source",
              match: { value: source },
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Qdrant delete error: ${await response.text()}`);
  }
}

async function upsertChunks(chunks: CsvChunk[]): Promise<void> {
  let sourceDeleted = false;

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(batch.map((chunk) => chunk.text));

    if (embeddings.length !== batch.length || !embeddings[0]) {
      throw new Error("Ollama returned an invalid number of embeddings");
    }

    await ensureCollection(embeddings[0].length);

    if (!sourceDeleted) {
      await deleteSourcePoints(batch[0].payload.source);
      sourceDeleted = true;
    }

    const response = await fetch(
      `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points?wait=true`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: batch.map((chunk, chunkIndex) => ({
            id: chunk.id,
            vector: embeddings[chunkIndex],
            payload: {
              ...chunk.payload,
              text: chunk.text,
            },
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Qdrant upsert error: ${await response.text()}`);
    }
  }
}

async function main() {
  const sourceStats = await stat(SOURCE_DIR);
  if (!sourceStats.isDirectory()) {
    throw new Error(`${SOURCE_DIR} is not a directory`);
  }

  const files = await findCsvFiles(SOURCE_DIR);

  if (files.length === 0) {
    console.log(`No CSV files found in ${SOURCE_DIR}`);
    return;
  }

  console.log(`Found ${files.length} CSV files in ${SOURCE_DIR}`);

  for (const [index, filePath] of files.entries()) {
    const text = await readFile(filePath, "utf8");
    const rows = parseCsv(text, detectDelimiter(text));
    const chunks = createChunks(filePath, rows);

    if (chunks.length === 0) {
      console.log(
        `[${index + 1}/${files.length}] Skipped empty CSV: ${filePath}`,
      );
      continue;
    }

    await upsertChunks(chunks);
    console.log(
      `[${index + 1}/${files.length}] Indexed ${chunks.length} chunks: ${filePath}`,
    );
  }

  console.log(`CSV indexing completed in collection "${QDRANT_COLLECTION}"`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
