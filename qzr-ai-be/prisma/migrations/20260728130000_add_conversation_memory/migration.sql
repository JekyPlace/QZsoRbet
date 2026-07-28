ALTER TABLE "chats"
ADD COLUMN "conversation_memory" JSONB,
ADD COLUMN "memory_message_count" INTEGER NOT NULL DEFAULT 0;
