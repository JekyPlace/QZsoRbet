import {
  useSidebarShell,
  type SidebarShellProps,
} from "./sidebarShell.brain";

export default function SidebarShell(props: SidebarShellProps) {
  const { className } = useSidebarShell(props.expanded);

  return <aside className={className}>{props.children}</aside>;
}
