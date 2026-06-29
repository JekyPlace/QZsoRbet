import logo from "#/assets/logo.png";

export type SidebarHeaderProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function useSidebarHeader(expanded: boolean) {
  return {
    logo,
    toggleLabel: expanded ? "Chiudi sidebar" : "Espandi sidebar",
  };
}
