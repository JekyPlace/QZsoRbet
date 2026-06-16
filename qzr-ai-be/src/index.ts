import "dotenv/config";
import cors from "cors";
import express from "express";
import chatRouter from "./routes/chat.js";
import chatsRouter from "./routes/chats.js";

const app = express();
const port = Number(process.env.PORT) || 8555;
const corsOrigin = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? ["http://localhost:3000"];

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use("/chat", chatRouter);
app.use("/chats", chatsRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
