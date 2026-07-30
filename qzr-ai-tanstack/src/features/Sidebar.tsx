import SidebarChatsList from "#/features/sidebar/chats/SidebarChatsList";
import SidebarDeleteChatDialog from "#/features/sidebar/chats/SidebarDeleteChatDialog";
import SidebarContent from "#/features/sidebar/composition/SidebarContent";
import SidebarHeader from "#/features/sidebar/composition/SidebarHeader";
import SidebarShell from "#/features/sidebar/composition/SidebarShell";
import { useSidebar, type SidebarProps } from "./sidebar.brain";

export type { Chat } from "#/types/api.types";

function Sidebar(props: SidebarProps) {
  const {
    chatToDelete,
    chats,
    closeSidebarOnMobile,
    closeDeleteDialog,
    confirmDelete,
    deleteError,
    error,
    isDeleting,
    isExpanded,
    openDeleteDialog,
    toggleSidebar,
  } = useSidebar(props);

  return (
    <>
      {isExpanded && (
        <button
          type="button"
          aria-label="Chiudi sidebar"
          className="fixed inset-0 z-10 bg-black/20 md:hidden"
          onClick={closeSidebarOnMobile}
        />
      )}

      <SidebarShell expanded={isExpanded}>
        <SidebarHeader
          expanded={isExpanded}
          onToggle={toggleSidebar}
        />

        <SidebarContent>
          <SidebarChatsList
            chats={chats}
            error={error}
            expanded={isExpanded}
            onDeleteChat={openDeleteDialog}
            onExpand={toggleSidebar}
            onNavigate={closeSidebarOnMobile}
          />
        </SidebarContent>

        {chatToDelete && (
          <SidebarDeleteChatDialog
            chat={chatToDelete}
            deleteError={deleteError}
            isDeleting={isDeleting}
            onCancel={closeDeleteDialog}
            onConfirm={confirmDelete}
          />
        )}
      </SidebarShell>
    </>
  );
}

export default Sidebar;
