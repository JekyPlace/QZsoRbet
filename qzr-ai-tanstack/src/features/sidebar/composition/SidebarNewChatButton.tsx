import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import {
  useSidebarNewChatButton,
  type SidebarNewChatButtonProps,
} from "./sidebarNewChatButton.brain";

export default function SidebarNewChatButton(
  props: SidebarNewChatButtonProps,
) {
  const { className } = useSidebarNewChatButton(props.expanded);

  return (
    <Link
      to="/"
      aria-label="Nuova chat"
      title="Nuova chat"
      className={className}
      onClick={props.onNavigate}
    >
      <PenLine size={17} />
    </Link>
  );
}
