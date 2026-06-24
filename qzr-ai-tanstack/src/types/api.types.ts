export type Message = {
  id: string;
  from: "HUMAN" | "CHATBOT";
  content: string;
  timestamp: string;
  chatId: string;
};

export type Chat = {
  id: string;
  label: string;
  messages: Message[];
  lastModification: string;
};

export type ChatMessageBody = {
  chatId?: string;
  label?: string;
  content: string;
  model?: string;
};

export type OllamaModel = {
  name: string;
};
