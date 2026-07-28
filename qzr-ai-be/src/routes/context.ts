import { mkdirSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Router } from "express";
import multer from "multer";
import { indexCsvFile } from "../../scripts/index-csv-to-qdrant.js";
import { indexPdfFile } from "../../scripts/index-pdf-to-qdrant.js";

const contextRouter = Router();
const defaultUploadDir =
  process.cwd() === "/app" ? "/app/uploads" : "../data/uploads";
const uploadDir = resolve(process.env.UPLOAD_SOURCE_DIR ?? defaultUploadDir);
const qdrantUrl = process.env.QDRANT_URL ?? "http://localhost:6333";
const qdrantCollection = process.env.QDRANT_COLLECTION ?? "csv_documents";

mkdirSync(uploadDir, { recursive: true });

function cleanFileName(fileName: string) {
  return fileName.replace(/[^\w.-]/g, "_");
}

function getFileType(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  if (extension === ".csv") return "csv";
  if (extension === ".pdf") return "pdf";

  return null;
}

function getOriginalName(storedName: string) {
  return storedName.replace(/^\d+-/, "");
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_request, file, callback) => {
      callback(null, `${Date.now()}-${cleanFileName(file.originalname)}`);
    },
  }),
  fileFilter: (_request, file, callback) => {
    if (getFileType(file.originalname)) {
      callback(null, true);
      return;
    }

    callback(new Error("Formato non supportato. Usa solo CSV o PDF."));
  },
});

contextRouter.get("/files", async (_request, response) => {
  try {
    const fileNames = await readdir(uploadDir);
    const files = await Promise.all(
      fileNames
        .filter((fileName) => getFileType(fileName))
        .map(async (fileName) => {
          const filePath = resolve(uploadDir, fileName);
          const fileStat = await stat(filePath);

          return {
            name: getOriginalName(fileName),
            storedName: fileName,
            type: getFileType(fileName),
            size: fileStat.size,
            uploadedAt: fileStat.birthtime.toISOString(),
          };
        }),
    );

    response.json(
      files.sort(
        (fileA, fileB) =>
          new Date(fileB.uploadedAt).getTime() -
          new Date(fileA.uploadedAt).getTime(),
      ),
    );
  } catch (error) {
    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Impossibile leggere i file caricati",
    });
  }
});

contextRouter.delete("/files/:storedName", async (request, response) => {
  const storedName = request.params.storedName;

  if (!storedName || cleanFileName(storedName) !== storedName) {
    response.status(400).json({ error: "Nome file non valido" });
    return;
  }

  const filePath = resolve(uploadDir, storedName);

  if (filePath !== uploadDir && !filePath.startsWith(`${uploadDir}${sep}`)) {
    response.status(400).json({ error: "Percorso file non valido" });
    return;
  }

  try {
    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      response.status(404).json({ error: "Documento non trovato" });
      return;
    }

    const collectionResponse = await fetch(
      `${qdrantUrl}/collections/${qdrantCollection}`,
    );

    if (!collectionResponse.ok && collectionResponse.status !== 404) {
      throw new Error(`Qdrant error: ${await collectionResponse.text()}`);
    }

    if (collectionResponse.ok) {
      const deletePointsResponse = await fetch(
        `${qdrantUrl}/collections/${qdrantCollection}/points/delete?wait=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filter: {
              must: [{ key: "fileName", match: { value: storedName } }],
            },
          }),
        },
      );

      if (!deletePointsResponse.ok) {
        throw new Error(`Qdrant delete error: ${await deletePointsResponse.text()}`);
      }
    }

    await unlink(filePath);
    response.status(204).send();
  } catch (error) {
    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Impossibile eliminare il documento",
    });
  }
});

contextRouter.post("/upload", (request, response) => {
  upload.single("file")(request, response, async (error) => {
    if (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "Upload non valido",
      });
      return;
    }

    const file = request.file;

    if (!file) {
      response.status(400).json({ error: "File mancante" });
      return;
    }

    const fileType = getFileType(file.originalname);

    if (!fileType) {
      response.status(400).json({
        error: "Formato non supportato. Usa solo CSV o PDF.",
      });
      return;
    }

    try {
      const indexing =
        fileType === "csv"
          ? await indexCsvFile(file.path)
          : await indexPdfFile(file.path);

      response.json({
        file: {
          name: file.originalname,
          storedName: file.filename,
          type: fileType,
          size: file.size,
        },
        indexing,
      });
    } catch (indexingError) {
      response.status(500).json({
        error:
          indexingError instanceof Error
            ? indexingError.message
            : "Indicizzazione fallita",
      });
    }
  });
});

export default contextRouter;
