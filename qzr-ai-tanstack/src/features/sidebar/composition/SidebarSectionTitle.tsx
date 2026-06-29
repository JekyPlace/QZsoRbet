import type { SidebarSectionTitleProps } from "./sidebarSectionTitle.brain";

export default function SidebarSectionTitle(props: SidebarSectionTitleProps) {
  if (!props.expanded) return null;

  return (
    <p className="m-0 px-1 text-base font-bold uppercase">
      {props.children}
    </p>
  );
}
