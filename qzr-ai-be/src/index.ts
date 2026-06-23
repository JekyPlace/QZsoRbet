import "dotenv/config";
import cors from "cors";
import express from "express";
import chatRouter from "./routes/chat.js";
import chatsRouter from "./routes/chats.js";
import { getOllamaModels } from "./services/ai.api.js";
import { getPdfContent } from "../scripts/index-pdf-to-qdrant.js";

const app = express();
const port = Number(process.env.PORT) || 8555;

const corsOrigin = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ["http://localhost:3000"];

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.get("/models", async (_request, response) => {
  try {
    response.json(await getOllamaModels());
  } catch (error) {
    console.error("Failed to get Ollama models", error);
    response.status(502).json({ error: "Failed to get Ollama models" });
  }
});
app.use("/chat", chatRouter);
app.use("/chats", chatsRouter);

getPdfContent().then((content) => {
  console.log(content);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
