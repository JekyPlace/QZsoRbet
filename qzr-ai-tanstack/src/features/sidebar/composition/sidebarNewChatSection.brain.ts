export type SidebarNewChatSectionProps = {
  children: React.ReactNode;
  expanded: boolean;
};

export function useSidebarNewChatSection(expanded: boolean) {
  return {
    className: `shrink-0 ${expanded ? "pb-1" : ""}`,
  };
}
