export function capitalizeFirstLetter(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return value;

  return (
    trimmedValue.charAt(0).toLocaleUpperCase("it-IT") + trimmedValue.slice(1)
  );
}
