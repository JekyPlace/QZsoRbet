import { capitalizeFirstLetter } from "#/utils/formatText";

export type ChatHeaderProps = {
  label: string;
};

export function useChatHeader(label: string) {
  return {
    title: capitalizeFirstLetter(label),
  };
}
