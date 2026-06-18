export default function formatDateMoment(date: Date | string) {
  const today = new Date();
  const yesterday = new Date();
  const targetDate = new Date(date);

  if (Number.isNaN(targetDate.getTime())) return "";

  yesterday.setDate(today.getDate() - 1);

  if (targetDate.toDateString() === today.toDateString()) return "Oggi";
  if (targetDate.toDateString() === yesterday.toDateString()) return "Ieri";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(targetDate);
}
