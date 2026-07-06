import SidebarChatsList from "#/features/sidebar/chats/SidebarChatsList";
import SidebarDeleteChatDialog from "#/features/sidebar/chats/SidebarDeleteChatDialog";
import SidebarContent from "#/features/sidebar/composition/SidebarContent";
import SidebarContextButton from "#/features/sidebar/composition/SidebarContextButton";
import SidebarHeader from "#/features/sidebar/composition/SidebarHeader";
import SidebarNewChatButton from "#/features/sidebar/composition/SidebarNewChatButton";
import SidebarNewChatSection from "#/features/sidebar/composition/SidebarNewChatSection";
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
          <SidebarNewChatSection expanded={isExpanded}>
            <SidebarNewChatButton
              expanded={isExpanded}
              onNavigate={closeSidebarOnMobile}
            />
          </SidebarNewChatSection>

          <SidebarContextButton
            expanded={isExpanded}
            onNavigate={closeSidebarOnMobile}
          />

          <SidebarChatsList
            chats={chats}
            error={error}
            expanded={isExpanded}
            onDeleteChat={openDeleteDialog}
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
