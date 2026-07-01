import { postMessage } from "./network";

type NavigateToChat = (options: {
  to: "/chat/$chatId";
  params: { chatId: string };
}) => void | Promise<void>;

export async function handleSubmit(
  messageFromBody: string,
  model: string | undefined,
  navigate: NavigateToChat,
) {
  const content = messageFromBody.trim();

  const message = {
    label: content.split(" ").slice(0, 10).join(" "),
    content,
    model,
  };

  const data = await postMessage(message);

  await navigate({
    to: "/chat/$chatId",
    params: {
      chatId: data.id,
    },
  });
}
