export type SidebarNewChatButtonProps = {
  expanded: boolean;
  onNavigate: () => void;
};

export function useSidebarNewChatButton(expanded: boolean) {
  return {
    className: `flex min-h-11 items-center rounded-full border-2 border-black bg-black font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black ${
      expanded ? "gap-3 px-4" : "justify-center"
    }`,
  };
}
