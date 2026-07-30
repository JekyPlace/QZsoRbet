export type SidebarNewChatButtonProps = {
  expanded: boolean;
  onNavigate: () => void;
};

export function useSidebarNewChatButton(_expanded: boolean) {
  return {
    className:
      "grid size-10 place-items-center rounded-full border-2 border-black bg-black text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.22)] transition hover:-translate-y-0.5 hover:bg-[#fff06a] hover:text-black hover:shadow-[3px_3px_0_rgb(0_0_0/0.28)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30",
  };
}
