import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { OllamaModel } from "#/types/api.types";

type ModelSelectProps = {
  disabled: boolean;
  isLoading: boolean;
  models: OllamaModel[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  size?: "compact" | "default";
};

export default function ModelSelect({
  disabled,
  isLoading,
  models,
  selectedModel,
  setSelectedModel,
  size = "default",
}: ModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasModels = models.length > 0;
  const label = selectedModel || (isLoading ? "Caricamento..." : "Default backend");
  const buttonSizeClass =
    size === "compact"
      ? "min-h-10 px-3 py-1.5 text-sm"
      : "min-h-12 px-3 py-2 text-base";

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 border-black bg-[#fff27a] text-left text-black shadow-[2px_2px_0_rgb(0_0_0/0.12)] outline-none transition hover:bg-[#fff6a3] focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-60 ${buttonSizeClass}`}
        onClick={() => {
          if (hasModels) setIsOpen((current) => !current);
        }}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          size={size === "compact" ? 18 : 20}
          className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && hasModels && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+0.375rem)] right-0 z-30 max-h-64 w-full min-w-56 overflow-y-auto rounded-lg border-2 border-black bg-[#fff333] p-1 shadow-[4px_4px_0_rgb(0_0_0/0.18)]"
        >
          {models.map((model) => {
            const isSelected = model.name === selectedModel;

            return (
              <button
                key={model.name}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-black font-bold text-[#fff333]"
                    : "text-black hover:bg-[#fff06a]"
                }`}
                onClick={() => {
                  setSelectedModel(model.name);
                  setIsOpen(false);
                }}
              >
                {model.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
