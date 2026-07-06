import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";
import { createEmbeddings } from "../src/services/embedding.api.js";

const SOURCE_DIR = resolve(
  process.env.PDF_SOURCE_DIR ??
    process.env.CSV_SOURCE_DIR ??
    "/Users/jacopo/Sources",
);
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "csv_documents";
const CHUNK_SIZE = Number(process.env.PDF_CHUNK_SIZE ?? 500);
const CHUNK_OVERLAP = Number(process.env.PDF_CHUNK_OVERLAP ?? 75);
const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 16);

type PdfChunk = {
  id: string;
  text: string;
  payload: {
    source: string;
    fileName: string;
    chunkIndex: number;
    type: "pdf";
  };
};

async function findPdfFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);

      if (entry.isDirectory()) return findPdfFiles(path);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        return [path];
      }

      return [];
    }),
  );

  return files.flat();
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

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + CHUNK_SIZE).trim();
    if (chunk) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export async function parsePdf(fileContent: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(fileContent));
  const { text } = await extractText(pdf, { mergePages: true });
  return normalizeText(text);
}

function createChunks(filePath: string, text: string): PdfChunk[] {
  const source = relative(SOURCE_DIR, filePath);

  return splitText(text).map((chunk, chunkIndex) => ({
    id: deterministicUuid(`${source}:${chunkIndex}`),
    text: [`Source PDF: ${source}`, "", chunk].join("\n\n"),
    payload: {
      source,
      fileName: basename(filePath),
      chunkIndex,
      type: "pdf",
    },
  }));
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

async function upsertChunks(chunks: PdfChunk[]): Promise<void> {
  let sourceDeleted = false;

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const batchNumber = Math.floor(index / EMBEDDING_BATCH_SIZE) + 1;
    const embeddings = await createEmbeddings(
      batch.map((chunk) => chunk.text),
    ).catch((error: unknown) => {
      throw new Error(
        `PDF embedding failed on batch ${batchNumber} (${batch.length} chunks): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    if (embeddings.length !== batch.length || !embeddings[0]) {
      throw new Error("Ollama returned an invalid number of embeddings");
    }

    await ensureCollection(embeddings[0].length).catch((error: unknown) => {
      throw new Error(
        `Qdrant collection check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    if (!sourceDeleted) {
      await deleteSourcePoints(batch[0].payload.source).catch(
        (error: unknown) => {
          throw new Error(
            `Qdrant delete failed for ${batch[0].payload.source}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        },
      );
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

export async function getPdfContent(): Promise<PdfChunk[]> {
  const files = await findPdfFiles(SOURCE_DIR);
  const chunks: PdfChunk[] = [];

  for (const filePath of files) {
    const text = await parsePdf(await readFile(filePath));
    chunks.push(...createChunks(filePath, text));
  }

  return chunks;
}

export async function indexPdfFile(filePath: string) {
  const text = await parsePdf(await readFile(filePath));
  const chunks = createChunks(filePath, text);

  if (chunks.length === 0) {
    return {
      filePath,
      chunks: 0,
      skipped: true,
    };
  }

  await upsertChunks(chunks);

  return {
    filePath,
    chunks: chunks.length,
    skipped: false,
  };
}

async function main() {
  const sourceStats = await stat(SOURCE_DIR);
  if (!sourceStats.isDirectory()) {
    throw new Error(`${SOURCE_DIR} is not a directory`);
  }

  const files = await findPdfFiles(SOURCE_DIR);

  if (files.length === 0) {
    console.log(`No PDF files found in ${SOURCE_DIR}`);
    return;
  }

  console.log(`Found ${files.length} PDF files in ${SOURCE_DIR}`);

  for (const [index, filePath] of files.entries()) {
    const result = await indexPdfFile(filePath);

    if (result.skipped) {
      console.log(
        `[${index + 1}/${files.length}] Skipped empty PDF: ${filePath}`,
      );
      continue;
    }

    console.log(
      `[${index + 1}/${files.length}] Indexed ${result.chunks} chunks: ${filePath}`,
    );
  }

  console.log(`PDF indexing completed in collection "${QDRANT_COLLECTION}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
