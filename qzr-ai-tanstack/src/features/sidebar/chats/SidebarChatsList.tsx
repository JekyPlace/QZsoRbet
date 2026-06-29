import { Link } from "@tanstack/react-router";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  useSidebarChatItem,
  useSidebarChatsList,
  type SidebarChatsListProps,
} from "./sidebarChatsList.brain";

export default function SidebarChatsList(props: SidebarChatsListProps) {
  const { hasChats, shouldShowEmptyState, shouldShowError } =
    useSidebarChatsList(props);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {shouldShowError && (
        <p className="m-0 rounded-lg border-2 border-black bg-[#fff27a] p-3 text-sm">
          {props.error}
        </p>
      )}

      {hasChats ? (
        <ul className="m-0 grid w-full list-none gap-2 p-0">
          {props.chats.map((chat) => (
            <SidebarChatItem
              key={chat.id}
              chat={chat}
              expanded={props.expanded}
              onDeleteChat={props.onDeleteChat}
            />
          ))}
        </ul>
      ) : (
        shouldShowEmptyState && (
          <p className="m-0 rounded-lg border-2 border-dashed border-black p-3 text-sm">
            Nessuna chat
          </p>
        )
      )}
    </div>
  );
}

type SidebarChatItemProps = {
  chat: SidebarChatsListProps["chats"][number];
  expanded: boolean;
  onDeleteChat: SidebarChatsListProps["onDeleteChat"];
};

function SidebarChatItem({
  chat,
  expanded,
  onDeleteChat,
}: SidebarChatItemProps) {
  const { chatLabel, formattedDate, itemClassName, linkClassName } =
    useSidebarChatItem(chat, expanded);

  return (
    <li className={itemClassName}>
      <Link
        to="/chat/$chatId"
        params={{ chatId: chat.id }}
        aria-label={chatLabel}
        activeProps={{
          "aria-current": "page",
          className: "bg-black text-[#fff333] shadow-[3px_3px_0_rgb(0_0_0/0.25)]",
        }}
        inactiveProps={{ className: "bg-[#fff333] text-black" }}
        className={linkClassName}
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-current group-aria-[current=page]:block"
        />
        <MessageSquare size={17} className="shrink-0" />
        {expanded && (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{chatLabel}</span>
            <span className="font-mono text-[0.62rem] leading-3.5 opacity-45">
              {formattedDate}
            </span>
          </span>
        )}
      </Link>

      {expanded && (
        <button
          type="button"
          aria-label={`Elimina ${chatLabel}`}
          className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-[#fff333] text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
          onClick={() => onDeleteChat(chat)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </li>
  );
}
