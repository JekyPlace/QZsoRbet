import { postMessage } from "./network";

type NavigateToChat = (options: {
  to: "/chat/$chatId";
  params: { chatId: string };
}) => void | Promise<void>;

export async function handleSubmit(
  messageFromBody: string,
  navigate: NavigateToChat,
) {
  const content = messageFromBody.trim();

  const message = {
    label: Array.from(content).slice(0, 10).join(""),
    content,
  };

  const data = await postMessage(message);

  await navigate({
    to: "/chat/$chatId",
    params: {
      chatId: data.id,
    },
  });
}
