import {
  useSidebarNewChatSection,
  type SidebarNewChatSectionProps,
} from "./sidebarNewChatSection.brain";

export default function SidebarNewChatSection(
  props: SidebarNewChatSectionProps,
) {
  const { className } = useSidebarNewChatSection(props.expanded);

  return <div className={className}>{props.children}</div>;
}
