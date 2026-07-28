import Sidebar from "#/features/Sidebar";
import ContextDropzone from "./ContextDropzone";
import ContextDeleteFileDialog from "./ContextDeleteFileDialog";
import ContextFileList from "./ContextFileList";
import { useContextPage } from "./contextPage.brain";

export default function ContextPage() {
  const contextPage = useContextPage();

  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-72 md:has-[.sidebar-collapsed]:pl-18">
      <Sidebar expanded />
      <main className="min-h-screen px-4 py-8 sm:px-6 md:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center">
          <div className="mb-5">
            <h1 className="m-0 text-2xl font-black sm:text-3xl">
              Fornisci contesto
            </h1>
            <p className="mt-2 mb-0 max-w-144 text-sm font-medium text-black/60">
              Prepara documenti CSV o PDF da usare come contesto per le risposte
              della chat.
            </p>
          </div>
          <ContextDropzone {...contextPage} />
          <ContextFileList {...contextPage} />
        </section>
      </main>
      {contextPage.fileToDelete && (
        <ContextDeleteFileDialog
          file={contextPage.fileToDelete}
          deleteError={contextPage.deleteError}
          isDeleting={contextPage.deletingStoredName !== null}
          onCancel={contextPage.closeDeleteDialog}
          onConfirm={contextPage.confirmDelete}
        />
      )}
    </div>
  );
}
