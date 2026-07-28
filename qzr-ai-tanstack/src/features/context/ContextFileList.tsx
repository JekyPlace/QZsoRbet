import { FileText, Trash2 } from "lucide-react";
import type { ContextPageState } from "./contextPage.brain";

type ContextFileListProps = Pick<
  ContextPageState,
  "contextFiles" | "deletingStoredName" | "handleDelete" | "isLoadingFiles"
>;

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function ContextFileList(props: ContextFileListProps) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-sm font-black">File caricati</h2>
        <span className="text-xs font-medium text-black/45">
          {props.contextFiles.length} documenti
        </span>
      </div>

      {props.isLoadingFiles && (
        <p className="m-0 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs font-medium text-black/50">
          Caricamento file...
        </p>
      )}

      {!props.isLoadingFiles && props.contextFiles.length === 0 && (
        <p className="m-0 rounded-2xl bg-black/[0.03] px-4 py-3 text-xs font-medium text-black/50">
          Nessun file caricato.
        </p>
      )}

      {!props.isLoadingFiles && props.contextFiles.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {props.contextFiles.map((file) => (
            <li
              key={file.storedName}
              className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/[0.03] px-4 py-3"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff333] text-black">
                <FileText size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-bold">{file.name}</p>
                <p className="mt-0.5 mb-0 text-xs font-medium text-black/45">
                  {file.type.toUpperCase()} · {formatFileSize(file.size)} ·{" "}
                  {formatDate(file.uploadedAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Elimina ${file.name}`}
                title={`Elimina ${file.name}`}
                disabled={props.deletingStoredName !== null}
                className="grid size-9 shrink-0 place-items-center rounded-full text-black/45 transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => props.handleDelete(file.storedName)}
              >
                {props.deletingStoredName === file.storedName ? (
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-label="Eliminazione in corso"
                  />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
