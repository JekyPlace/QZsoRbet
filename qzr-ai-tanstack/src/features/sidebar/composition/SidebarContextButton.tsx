import { Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import {
  useSidebarContextButton,
  type SidebarContextButtonProps,
} from "./sidebarContextButton.brain";

export default function SidebarContextButton(
  props: SidebarContextButtonProps,
) {
  const { className } = useSidebarContextButton(props.expanded);

  return (
    <Link
      to="/context"
      aria-label="Fornisci contesto"
      className={className}
      onClick={props.onNavigate}
    >
      <Brain size={14} />
      {props.expanded && (
        <span className="truncate text-xs font-medium">Fornisci contesto</span>
      )}
    </Link>
  );
}
