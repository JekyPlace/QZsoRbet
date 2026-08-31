import "dotenv/config";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createEmbeddings } from "../src/services/embedding.api.js";

const WORDPRESS_API_URL = (
  process.env.WORDPRESS_API_URL ??
  "http://localhost:8888/gestionaleQualityMade_REST_integration/wp-json"
).replace(/\/$/, "");
const WORDPRESS_TIMEOUT_MS = Number(
  process.env.WORDPRESS_TIMEOUT_MS ?? 10_000,
);
const WORDPRESS_PER_PAGE = 100;
const WORDPRESS_MAX_TEXT_LENGTH = Number(
  process.env.WORDPRESS_MAX_TEXT_LENGTH ?? 6_000,
);

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "csv_documents";
const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 16);

type ContextDocument = {
  id: string;
  payload: Record<string, unknown>;
  text: string;
};

function createId(value: string) {
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

function cleanHtml(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getTranslation(value: any) {
  const translation = value?.translation ?? value;

  return cleanHtml(
    translation?.it?.text ??
      translation?.en?.text ??
      translation?.fr?.text ??
      value,
  );
}

function getTermNames(terms: any) {
  if (!Array.isArray(terms)) return "";

  return terms
    .map((term) => term?.name_it || term?.name || term?.slug)
    .filter(Boolean)
    .join(", ");
}

function getTermSlugs(terms: any) {
  if (!Array.isArray(terms)) return [];
  return terms.map((term) => term?.slug).filter(Boolean);
}

function addLine(lines: string[], label: string, value: unknown) {
  const text =
    typeof value === "string" || typeof value === "number"
      ? String(value).trim()
      : "";

  if (text) lines.push(`${label}: ${text}`);
}

function createDocument(
  entityType: string,
  item: any,
  lines: string[],
  extraPayload: Record<string, unknown> = {},
): ContextDocument | null {
  const id = Number(item?.id);
  const title = cleanHtml(item?.title?.rendered ?? item?.title);

  if (!Number.isInteger(id) || !title) return null;

  const source = `wordpress:${entityType}:${id}`;
  const text = [
    `Contenuto WordPress: ${entityType}`,
    `Titolo: ${title}`,
    ...lines,
  ]
    .join("\n")
    .slice(0, WORDPRESS_MAX_TEXT_LENGTH);

  return {
    id: createId(source),
    text,
    payload: {
      source,
      sourceProvider: "wordpress",
      type: "wordpress",
      entityType,
      entityId: id,
      title,
      modifiedGmt: item.modified_gmt ?? item.modified,
      ...extraPayload,
    },
  };
}

function normalizeObject(item: any) {
  const lines: string[] = [];
  const position = item.position ?? {};
  const additionalInfo = item.additional_info ?? {};

  addLine(lines, "Tipologia", item.type?.label ?? item.type?.value);
  addLine(lines, "Regione", getTermNames(item.region));
  addLine(lines, "Tema principale", getTermNames(item.main_theme));
  addLine(lines, "Temi secondari", getTermNames(item.secondary_themes));
  addLine(lines, "Descrizione", getTranslation(item.description));
  addLine(
    lines,
    "Indirizzo",
    position.formatted_address ?? position.address,
  );
  addLine(
    lines,
    "Accessibilità",
    additionalInfo.accessibility?.label ??
      additionalInfo.accessibility?.value,
  );
  addLine(
    lines,
    "Tempo di visita",
    additionalInfo.visit_time?.label ?? additionalInfo.visit_time?.value,
  );
  addLine(lines, "Periodo", getTranslation(additionalInfo.date_text));

  if (Number(item.rating?.total) > 0) {
    addLine(
      lines,
      "Valutazione",
      `${Number(item.rating.average).toFixed(1)} su 5`,
    );
  }

  return createDocument("object", item, lines, {
    regionSlugs: getTermSlugs(item.region),
    latitude: Number(position.latitude) || undefined,
    longitude: Number(position.longitude) || undefined,
  });
}

function normalizeTransport(item: any) {
  const lines: string[] = [];
  const accessibility = Object.entries(item.accessibility ?? {})
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => name)
    .join(", ");

  addLine(lines, "Tipologia", item.type?.label ?? item.type?.value);
  addLine(lines, "Regione", getTermNames(item.region));
  addLine(
    lines,
    "Località",
    item.location?.formatted_address ??
      item.location?.address ??
      item.location,
  );
  addLine(lines, "Indirizzo", item.address);
  addLine(lines, "Capacità", item.capacity);
  addLine(lines, "Accessibilità supportata", accessibility);

  return createDocument("transport", item, lines, {
    regionSlugs: getTermSlugs(item.region),
  });
}

function normalizeRoute(item: any) {
  const lines: string[] = [];
  const objectNames = Array.isArray(item.objects)
    ? item.objects.map((object: any) => object?.title).filter(Boolean).join(", ")
    : "";

  addLine(lines, "Sottotitolo", getTranslation(item.subtitle));
  addLine(lines, "Descrizione", getTranslation(item.description));
  addLine(lines, "Regione", getTermNames(item.region));
  addLine(lines, "Tema principale", getTermNames(item.main_theme));
  addLine(lines, "Temi secondari", getTermNames(item.secondary_themes));
  addLine(lines, "Luoghi inclusi", objectNames);

  return createDocument("route", item, lines, {
    regionSlugs: getTermSlugs(item.region),
  });
}

function normalizePost(item: any) {
  const lines: string[] = [];

  addLine(lines, "Estratto", cleanHtml(item.excerpt?.rendered));
  addLine(lines, "Contenuto", cleanHtml(item.content?.rendered));

  return createDocument("post", item, lines);
}

async function fetchJson(path: string) {
  const response = await fetch(`${WORDPRESS_API_URL}/${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(WORDPRESS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`WordPress ${response.status}: ${path}`);
  }

  return response;
}

async function fetchCatalog(path: string) {
  const items: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchJson(
      `${path}?page=${page}&per_page=${WORDPRESS_PER_PAGE}`,
    );
    const data = (await response.json()) as any;

    if (!Array.isArray(data.items)) {
      throw new Error(`Risposta non valida da ${path}`);
    }

    items.push(...data.items);
    totalPages = Number(data.pagination?.total_pages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return items;
}

async function fetchPosts() {
  const posts: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchJson(
      `wp/v2/posts?page=${page}&per_page=${WORDPRESS_PER_PAGE}&status=publish`,
    );
    const currentPosts = (await response.json()) as any[];

    if (!Array.isArray(currentPosts)) {
      throw new Error("Risposta non valida da wp/v2/posts");
    }

    posts.push(...currentPosts);
    totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
    page += 1;
  } while (page <= totalPages);

  return posts;
}

async function fetchDocuments() {
  const [objects, transports, routesResponse, posts] = await Promise.all([
    fetchCatalog("qzr-api/objects/catalog"),
    fetchCatalog("qzr-api/transports/catalog"),
    fetchJson("qzr-api/routes?uid=qzr-ai-indexer"),
    fetchPosts(),
  ]);
  const routes = (await routesResponse.json()) as any[];

  if (!Array.isArray(routes)) {
    throw new Error("Risposta non valida da qzr-api/routes");
  }

  return [
    ...objects.map(normalizeObject),
    ...transports.map(normalizeTransport),
    ...routes.map(normalizeRoute),
    ...posts.map(normalizePost),
  ].filter((document): document is ContextDocument => document !== null);
}

async function ensureCollection(vectorSize: number) {
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
    throw new Error(`Qdrant create error: ${await response.text()}`);
  }
}

async function deleteOldWordPressContext() {
  const response = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/delete?wait=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [
            {
              key: "sourceProvider",
              match: { value: "wordpress" },
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

async function indexDocuments(documents: ContextDocument[]) {
  const points = [];

  for (let index = 0; index < documents.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = documents.slice(index, index + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(
      batch.map((document) => document.text),
    );

    points.push(
      ...batch.map((document, documentIndex) => ({
        id: document.id,
        vector: embeddings[documentIndex],
        payload: {
          ...document.payload,
          text: document.text,
        },
      })),
    );
  }

  const firstVector = points[0]?.vector;
  if (!firstVector) return;

  await ensureCollection(firstVector.length);
  await deleteOldWordPressContext();

  for (let index = 0; index < points.length; index += EMBEDDING_BATCH_SIZE) {
    const response = await fetch(
      `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points?wait=true`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: points.slice(index, index + EMBEDDING_BATCH_SIZE),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Qdrant upsert error: ${await response.text()}`);
    }
  }
}

export async function indexWordPressContext() {
  console.log("Recupero contenuti WordPress...");
  const documents = await fetchDocuments();

  if (documents.length === 0) {
    console.log("Nessun contenuto WordPress trovato");
    return;
  }

  console.log(`Indicizzo ${documents.length} contenuti WordPress...`);
  await indexDocuments(documents);
  console.log(`Indicizzazione completata in "${QDRANT_COLLECTION}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  indexWordPressContext().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
