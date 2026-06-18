import { format, isToday, isValid, isYesterday } from "date-fns";
import { it } from "date-fns/locale";

export default function formatDate(date: Date | string) {
  const targetDate = new Date(date);

  if (!isValid(targetDate)) return "";

  if (isToday(targetDate)) return "Oggi";
  if (isYesterday(targetDate)) return "Ieri";

  return format(targetDate, "dd/MM/yyyy", { locale: it });
}
