import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
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
const CHUNK_SIZE = Number(process.env.PDF_CHUNK_SIZE ?? 1200);
const CHUNK_OVERLAP = Number(process.env.PDF_CHUNK_OVERLAP ?? 200);
const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 16);
const DEBUG_INDEX_CHUNKS = process.env.DEBUG_INDEX_CHUNKS === "true";
const DEBUG_INDEX_CHUNK_LIMIT = Number(process.env.DEBUG_INDEX_CHUNK_LIMIT ?? 5);
const DEBUG_INDEX_CHARS = Number(process.env.DEBUG_INDEX_CHARS ?? 1600);
const DEBUG_INDEX_OUTPUT_DIR =
  process.env.DEBUG_INDEX_OUTPUT_DIR ?? "/app/uploads/debug";

type PdfChunk = {
  id: string;
  text: string;
  payload: {
    source: string;
    fileName: string;
    chunkIndex: number;
    page: number;
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
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const slice = text.slice(start, end);
      const paragraphBreak = slice.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
      );
      const breakPoint = paragraphBreak > CHUNK_SIZE * 0.55
        ? paragraphBreak
        : sentenceBreak;

      if (breakPoint > CHUNK_SIZE * 0.55) {
        end = start + breakPoint + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

export async function parsePdf(fileContent: Buffer): Promise<string[]> {
  const pdf = await getDocumentProxy(new Uint8Array(fileContent));
  const { text } = await extractText(pdf);
  return text.map(normalizeText).filter(Boolean);
}

function createChunks(filePath: string, pages: string[]): PdfChunk[] {
  const source = relative(SOURCE_DIR, filePath);

  return pages.flatMap((pageText, pageIndex) =>
    splitText(pageText).map((chunk, chunkIndex) => {
      const globalChunkIndex = pageIndex * 1000 + chunkIndex;

      return {
        id: deterministicUuid(`${source}:${globalChunkIndex}`),
        text: [
          `Documento PDF: ${source}`,
          `Pagina: ${pageIndex + 1}`,
          "",
          chunk,
        ].join("\n\n"),
        payload: {
          source,
          fileName: basename(filePath),
          chunkIndex: globalChunkIndex,
          page: pageIndex + 1,
          type: "pdf",
        },
      };
    }),
  );
}

function cleanDebugFileName(fileName: string) {
  return fileName.replace(/[^\w.-]/g, "_");
}

async function debugChunksBeforeEmbedding(chunks: PdfChunk[]) {
  if (!DEBUG_INDEX_CHUNKS) return;

  const chunksToShow = chunks.slice(0, DEBUG_INDEX_CHUNK_LIMIT);
  const debugText = [
    `[debug] PDF chunks before embedding: showing ${chunksToShow.length}/${chunks.length}`,
    ...chunksToShow.map((chunk) =>
      [
        "",
        "--- chunk before embedding ---",
        `source: ${chunk.payload.source}`,
        `page: ${chunk.payload.page}`,
        `chunkIndex: ${chunk.payload.chunkIndex}`,
        `chars: ${chunk.text.length}`,
        "",
        chunk.text.slice(0, DEBUG_INDEX_CHARS),
        chunk.text.length > DEBUG_INDEX_CHARS ? "\n...[truncated]" : "",
        "--- end chunk ---",
      ].join("\n"),
    ),
  ].join("\n");

  console.info(`\n${debugText}`);

  try {
    await mkdir(DEBUG_INDEX_OUTPUT_DIR, { recursive: true });

    const source = chunks[0]?.payload.source ?? "pdf";
    const debugFilePath = resolve(
      DEBUG_INDEX_OUTPUT_DIR,
      `${Date.now()}-${cleanDebugFileName(basename(source))}.txt`,
    );

    await writeFile(debugFilePath, debugText, "utf8");
    console.info(`[debug] PDF chunks written to ${debugFilePath}`);
  } catch (error) {
    console.warn(
      "[debug] Unable to write PDF chunks debug file:",
      error instanceof Error ? error.message : error,
    );
  }
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

  await debugChunksBeforeEmbedding(chunks);

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
    const pages = await parsePdf(await readFile(filePath));
    chunks.push(...createChunks(filePath, pages));
  }

  return chunks;
}

export async function indexPdfFile(filePath: string) {
  const pages = await parsePdf(await readFile(filePath));
  const chunks = createChunks(filePath, pages);

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
