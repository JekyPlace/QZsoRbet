import { Link } from "@tanstack/react-router";
import { Brain, Search } from "lucide-react";
import type { RefObject } from "react";

type SidebarChatControlsProps = {
  expanded: boolean;
  isSearchOpen: boolean;
  onNavigate: () => void;
  onSearchChange: (value: string) => void;
  onSearchToggle: () => void;
  searchDisabled: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
};

export default function SidebarChatControls({
  expanded,
  isSearchOpen,
  onNavigate,
  onSearchChange,
  onSearchToggle,
  searchDisabled,
  searchInputRef,
  searchQuery,
}: SidebarChatControlsProps) {
  const circleClassName =
    "grid size-10 shrink-0 place-items-center rounded-full border border-black/15 bg-[#fff333] text-black transition hover:border-black/30 hover:bg-[#fff06a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30";
  const shouldShowSearchInput = expanded && isSearchOpen;

  return (
    <div className="flex w-full items-center gap-2">
      {shouldShowSearchInput ? (
        <div className="flex min-h-10 min-w-0 flex-1 items-center rounded-full border border-black/20 bg-[#fff27a]/60 text-black transition focus-within:border-black focus-within:bg-[#fff27a]">
          <button
            type="button"
            aria-label="Chiudi ricerca chat"
            className="grid size-10 shrink-0 place-items-center rounded-full text-black/55 transition hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
            onClick={onSearchToggle}
          >
            <Search size={15} />
          </button>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onSearchToggle();
            }}
            placeholder="Cerca chat"
            className="min-w-0 flex-1 border-0 bg-transparent py-1.5 pr-3 text-xs outline-none placeholder:text-black/40"
          />
        </div>
      ) : (
        <button
          type="button"
          title="Ricerca"
          aria-label="Cerca nelle chat"
          aria-expanded={false}
          className={`${circleClassName} disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={searchDisabled || !expanded}
          onClick={onSearchToggle}
        >
          <Search size={15} />
        </button>
      )}

      <Link
        to="/context"
        title="Cervello"
        aria-label="Cervello"
        className={circleClassName}
        onClick={onNavigate}
      >
        <Brain size={15} />
      </Link>
    </div>
  );
}
