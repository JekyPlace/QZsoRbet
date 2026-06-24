export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type OllamaModel = {
  name: string;
};
