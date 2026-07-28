import { FileText, LoaderCircle, UploadCloud } from "lucide-react";
import type { ContextPageState } from "./contextPage.brain";

type ContextDropzoneProps = Pick<
  ContextPageState,
  | "error"
  | "handleDragLeave"
  | "handleDragOver"
  | "handleDrop"
  | "isDragging"
  | "isUploading"
  | "uploadProgress"
  | "uploadedFiles"
>;

export default function ContextDropzone(props: ContextDropzoneProps) {
  const completedWidth = props.uploadProgress
    ? `${(props.uploadProgress.completed / props.uploadProgress.total) * 100}%`
    : "0%";
  const currentWidth = props.uploadProgress
    ? `${100 / props.uploadProgress.total}%`
    : "0%";

  return (
    <div
      className={`flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition ${
        props.isUploading
          ? "cursor-wait border-black bg-[#fff6a3]"
          : props.isDragging
          ? "border-black bg-[#fff6a3]"
          : "border-black/30 bg-[#fff27a]/70"
      }`}
      aria-busy={props.isUploading}
      onDragLeave={props.handleDragLeave}
      onDragOver={props.handleDragOver}
      onDrop={props.handleDrop}
    >
      {props.isUploading && props.uploadProgress ? (
        <div
          className="w-full max-w-md rounded-2xl border-2 border-black bg-[#fff333] p-5 text-left shadow-[4px_4px_0_rgb(0_0_0/0.18)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-black text-[#fff333]">
              <LoaderCircle size={21} className="animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-sm font-black">
                Caricamento e indicizzazione
              </p>
              <p className="mt-1 mb-0 truncate text-xs font-medium text-black/55">
                {props.uploadProgress.fileName}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs font-bold">
            <span>
              Documento {props.uploadProgress.current} di{" "}
              {props.uploadProgress.total}
            </span>
            <span className="font-mono text-[0.65rem] text-black/50">
              {props.uploadProgress.completed}{" "}
              {props.uploadProgress.completed === 1
                ? "completato"
                : "completati"}
            </span>
          </div>

          <div
            className="relative mt-2 h-2 overflow-hidden rounded-full bg-black/10"
            aria-hidden="true"
          >
            <div
              className="absolute inset-y-0 left-0 bg-black transition-[width] duration-300"
              style={{ width: completedWidth }}
            />
            {props.uploadProgress.completed < props.uploadProgress.total && (
              <div
                className="absolute inset-y-0 animate-pulse bg-black/45 transition-[left,width] duration-300"
                style={{
                  left: completedWidth,
                  width: currentWidth,
                }}
              />
            )}
          </div>

          <p className="mt-3 mb-0 text-xs font-medium text-black/50">
            I PDF più lunghi possono richiedere qualche minuto. Non chiudere la
            pagina.
          </p>
        </div>
      ) : (
        <>
          <div className="grid size-12 place-items-center rounded-full bg-black text-[#fff333]">
            <UploadCloud size={22} />
          </div>
          <p className="mt-4 mb-1 text-lg font-black">
            Trascina qui i tuoi documenti
          </p>
          <p className="m-0 text-sm font-medium text-black/55">
            Sono accettati solo file .csv e .pdf
          </p>
        </>
      )}

      {!props.isUploading && props.error && (
        <p className="mt-4 mb-0 text-sm font-bold text-black" role="alert">
          {props.error}
        </p>
      )}

      {!props.isUploading && props.uploadedFiles.length > 0 && (
        <ul className="mt-5 grid w-full max-w-md list-none gap-2 p-0">
          {props.uploadedFiles.map((upload) => (
            <li
              key={upload.file.storedName}
              className="flex min-w-0 items-center gap-2 rounded-full bg-[#fff333] px-3 py-2 text-left text-xs font-medium"
            >
              <FileText size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {upload.file.name}
              </span>
              <span className="shrink-0 font-mono text-[0.62rem] text-black/50">
                {upload.indexing.skipped
                  ? "vuoto"
                  : `${upload.indexing.chunks} chunk`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
