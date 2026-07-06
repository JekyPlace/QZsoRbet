import { FileText, UploadCloud } from "lucide-react";
import type { ContextPageState } from "./contextPage.brain";

type ContextDropzoneProps = Pick<
  ContextPageState,
  | "error"
  | "handleDragLeave"
  | "handleDragOver"
  | "handleDrop"
  | "isDragging"
  | "isUploading"
  | "uploadedFiles"
>;

export default function ContextDropzone(props: ContextDropzoneProps) {
  return (
    <div
      className={`flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition ${
        props.isDragging
          ? "border-black bg-[#fff6a3]"
          : "border-black/30 bg-[#fff27a]/70"
      }`}
      onDragLeave={props.handleDragLeave}
      onDragOver={props.handleDragOver}
      onDrop={props.handleDrop}
    >
      <div className="grid size-12 place-items-center rounded-full bg-black text-[#fff333]">
        <UploadCloud size={22} />
      </div>
      <p className="mt-4 mb-1 text-lg font-black">Trascina qui i tuoi documenti</p>
      <p className="m-0 text-sm font-medium text-black/55">
        Sono accettati solo file .csv e .pdf
      </p>

      {props.isUploading && (
        <p className="mt-4 mb-0 text-sm font-bold text-black" role="status">
          Upload e indicizzazione in corso...
        </p>
      )}

      {props.error && (
        <p className="mt-4 mb-0 text-sm font-bold text-black" role="alert">
          {props.error}
        </p>
      )}

      {props.uploadedFiles.length > 0 && (
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
