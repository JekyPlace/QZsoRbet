import {
  useChatHeader,
  type ChatHeaderProps,
} from "./chatHeader.brain";

export default function ChatHeader(props: ChatHeaderProps) {
  const { title } = useChatHeader(props.label);

  return (
    <header className="mb-5 border-b-2 border-black pb-4 sm:mb-7">
      <h1 className="mt-1 mb-0 truncate text-xl font-black sm:text-2xl">
        {title}
      </h1>
    </header>
  );
}
