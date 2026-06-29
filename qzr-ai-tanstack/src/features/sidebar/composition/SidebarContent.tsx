import type { SidebarContentProps } from "./sidebarContent.brain";

export default function SidebarContent(props: SidebarContentProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 sm:gap-4 sm:p-3">
      {props.children}
    </div>
  );
}
