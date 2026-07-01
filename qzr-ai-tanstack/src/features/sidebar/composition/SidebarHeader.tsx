import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import {
  useSidebarHeader,
  type SidebarHeaderProps,
} from "./sidebarHeader.brain";

export default function SidebarHeader(props: SidebarHeaderProps) {
  const { logo, toggleLabel } = useSidebarHeader(props.expanded);

  return (
    <header
      className={`flex h-18 shrink-0 items-center ${
        props.expanded ? "justify-between px-4" : "justify-center"
      }`}
    >
      {props.expanded && (
        <Link
          to="/"
          className="flex min-w-0 items-center gap-x-1 text-black"
        >
          <img className="w-9 shrink-0" src={logo} alt="" />
          <span className="ml-1 truncate text-xl font-black uppercase">
            QZsoRbet
          </span>
          <span className="text-[0.62rem] font-medium text-black/50">by</span>
          <span className="text-xl font-black uppercase">QZR</span>
        </Link>
      )}

      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={props.expanded}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff27a] text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
        onClick={props.onToggle}
      >
        {props.expanded ? <X size={18} /> : <ArrowRight size={18} />}
      </button>
    </header>
  );
}
