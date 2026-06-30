export default function HomeCreatingState() {
  return (
    <div
      className="flex w-full max-w-176 flex-col items-center gap-4 rounded-xl bg-[#fff333] p-8 text-center text-black"
      aria-live="polite"
      aria-label="Creazione chat in corso"
    >
      <span className="size-8 animate-spin rounded-full border-3 border-black border-t-transparent" />
      <div>
        <p className="m-0 text-lg font-bold">Creazione della chat...</p>
        <p className="mt-1 mb-0 text-sm opacity-65">
          QZsoRbet sta preparando la risposta.
        </p>
      </div>
    </div>
  );
}
