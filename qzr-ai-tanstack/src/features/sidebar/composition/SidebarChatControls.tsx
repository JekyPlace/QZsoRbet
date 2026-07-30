import { Link } from "@tanstack/react-router";
import { Brain, Search } from "lucide-react";
import type { RefObject } from "react";
import SidebarNewChatButton from "./SidebarNewChatButton";

type SidebarChatControlsProps = {
  expanded: boolean;
  onNavigate: () => void;
  onSearchChange: (value: string) => void;
  onSearchOpen: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
};

export default function SidebarChatControls({
  expanded,
  onNavigate,
  onSearchChange,
  onSearchOpen,
  searchInputRef,
  searchQuery,
}: SidebarChatControlsProps) {
  const circleClassName =
    "grid size-10 shrink-0 place-items-center rounded-full border border-black/15 bg-[#fff333] text-black transition hover:border-black/30 hover:bg-[#fff06a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30";
  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={`flex items-center gap-2 ${expanded ? "" : "flex-col"}`}
      >
        <SidebarNewChatButton expanded={expanded} onNavigate={onNavigate} />

        <Link
          to="/context"
          title="Cervello"
          aria-label="Cervello"
          className={circleClassName}
          onClick={onNavigate}
          activeProps={{
            "aria-current": "page",
            className: "border-black shadow-[2px_2px_0_rgb(0_0_0/0.18)]",
          }}
        >
          <Brain size={15} />
        </Link>
      </div>

      {expanded && (
        <div className="flex min-h-10 w-full items-center rounded-full border border-black/20 bg-[#fff27a]/60 text-black transition focus-within:border-black focus-within:bg-[#fff27a]">
          <span className="grid size-10 shrink-0 place-items-center text-black/55">
            <Search size={15} />
          </span>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cerca chat"
            aria-label="Cerca nelle chat"
            className="min-w-0 flex-1 border-0 bg-transparent py-1.5 pr-3 text-xs outline-none placeholder:text-black/40"
          />
        </div>
      )}

      {!expanded && (
        <button
          type="button"
          title="Cerca nelle chat"
          aria-label="Cerca nelle chat"
          className={circleClassName}
          onClick={onSearchOpen}
        >
          <Search size={15} />
        </button>
      )}
    </div>
  );
}
