import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
      className={className}
      onClick={props.onNavigate}
    >
      <Plus size={20} />
      {props.expanded && <span>Nuova chat</span>}
    </Link>
  );
}
