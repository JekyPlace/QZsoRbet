export type SidebarContextButtonProps = {
  expanded: boolean;
  onNavigate: () => void;
};

export function useSidebarContextButton(expanded: boolean) {
  return {
    className: `flex min-h-10 items-center rounded-full border border-black/15 bg-[#fff333] text-black transition hover:border-black/30 hover:bg-[#fff06a] ${
      expanded ? "gap-2.5 px-3" : "justify-center"
    }`,
  };
}
