export type SidebarShellProps = {
  expanded: boolean;
  children: React.ReactNode;
};

export function useSidebarShell(expanded: boolean) {
  return {
    className: `sidebar fixed inset-y-0 left-0 z-20 flex max-w-[calc(100vw-1rem)] flex-col border-r-2 border-black bg-[#fff333] shadow-[6px_0_0_rgb(0_0_0/0.12)] transition-[width] duration-200 md:shadow-none ${
      expanded
        ? "sidebar-expanded w-[min(22rem,calc(100vw-1rem))]"
        : "sidebar-collapsed w-16 sm:w-18"
    }`,
  };
}
