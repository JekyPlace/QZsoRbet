export type SidebarNewChatSectionProps = {
  children: React.ReactNode;
  expanded: boolean;
};

export function useSidebarNewChatSection(expanded: boolean) {
  return {
    className: `shrink-0 ${expanded ? "border-b-2 border-black pb-3" : ""}`,
  };
}
