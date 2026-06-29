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
      className={`flex h-18 shrink-0 items-center border-b-2 border-black ${
        props.expanded ? "justify-between px-4" : "justify-center"
      }`}
    >
      {props.expanded && (
        <Link
          to="/"
          className="text-lg tracking-[0.12em] text-black flex items-center gap-x-1 font-weight-bold"
        >
          <img className="w-12" src={logo}></img>
          <h4 className="uppercase text-3xl ml-2">QZsoRbet</h4>
          <span className="text-xs">by</span>
          <h4 className="text-3xl uppercase">QZR</h4>
        </Link>
      )}

      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={props.expanded}
        className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-[#fff333] text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
        onClick={props.onToggle}
      >
        {props.expanded ? <X size={20} /> : <ArrowRight size={20} />}
      </button>
    </header>
  );
}
