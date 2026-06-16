import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const chatsRouter = Router();

chatsRouter.get("/", async (_request, response) => {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { lastModification: "desc" },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });

    response.json(chats);
  } catch (error) {
    console.error("Failed to get chats", error);
    response.status(500).json({ error: "Failed to get chats" });
  }
});

export default chatsRouter;
