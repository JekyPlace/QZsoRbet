import formatDate from "#/utils/formatDate";

type ChatDateSeparatorParams = {
  timestamp?: string;
  previousTimestamp?: string;
};

export type ChatDateSeparatorProps = ChatDateSeparatorParams;

function getMessageDateKey(timestamp?: string) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return [date.getFullYear(), date.getMonth(), date.getDate()].join("-");
}

export function useChatDateSeparator({
  timestamp,
  previousTimestamp,
}: ChatDateSeparatorParams) {
  const messageDateKey = getMessageDateKey(timestamp);
  const previousMessageDateKey = getMessageDateKey(previousTimestamp);
  const shouldShowDateSeparator =
    Boolean(messageDateKey) && messageDateKey !== previousMessageDateKey;

  return {
    dateLabel: timestamp ? formatDate(timestamp) : "",
    shouldShowDateSeparator,
  };
}
