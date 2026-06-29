import {
  useSidebarDeleteChatDialog,
  type SidebarDeleteChatDialogProps,
} from "./sidebarDeleteChatDialog.brain";

export default function SidebarDeleteChatDialog(
  props: SidebarDeleteChatDialogProps,
) {
  const { confirmLabel, description, title } =
    useSidebarDeleteChatDialog(props);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      role="presentation"
      onClick={props.onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-title"
        aria-describedby="delete-chat-description"
        className="w-full max-w-md rounded-xl border-2 border-black bg-[#fff333] p-5 text-black shadow-[6px_6px_0_rgb(0_0_0/0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-chat-title" className="m-0 text-xl font-black">
          {title}
        </h2>
        <p id="delete-chat-description" className="mt-2 mb-0">
          {description}
        </p>

        {props.deleteError && (
          <p
            role="alert"
            className="mt-3 mb-0 rounded-lg border-2 border-black bg-[#fff27a] p-3 text-sm font-medium"
          >
            {props.deleteError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={props.isDeleting}
            className="rounded-lg border-2 border-black bg-[#fff27a] px-4 py-2 font-bold text-black transition hover:bg-[#fff06a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={props.onCancel}
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={props.isDeleting}
            className="rounded-lg border-2 border-black bg-black px-4 py-2 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={props.onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
