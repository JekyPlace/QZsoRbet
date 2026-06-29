import SidebarChatsList from "#/features/sidebar/chats/SidebarChatsList";
import SidebarDeleteChatDialog from "#/features/sidebar/chats/SidebarDeleteChatDialog";
import SidebarContent from "#/features/sidebar/composition/SidebarContent";
import SidebarHeader from "#/features/sidebar/composition/SidebarHeader";
import SidebarNewChatButton from "#/features/sidebar/composition/SidebarNewChatButton";
import SidebarNewChatSection from "#/features/sidebar/composition/SidebarNewChatSection";
import SidebarSectionTitle from "#/features/sidebar/composition/SidebarSectionTitle";
import SidebarShell from "#/features/sidebar/composition/SidebarShell";
import { useSidebar, type SidebarProps } from "./sidebar.brain";

export type { Chat } from "#/types/api.types";

function Sidebar(props: SidebarProps) {
  const {
    chatToDelete,
    chats,
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
    <SidebarShell expanded={isExpanded}>
      <SidebarHeader
        expanded={isExpanded}
        onToggle={toggleSidebar}
      />

      <SidebarContent>
        <SidebarNewChatSection expanded={isExpanded}>
          <SidebarNewChatButton expanded={isExpanded} />
        </SidebarNewChatSection>

        <SidebarSectionTitle expanded={isExpanded}>
          Conversazioni
        </SidebarSectionTitle>

        <SidebarChatsList
          chats={chats}
          error={error}
          expanded={isExpanded}
          onDeleteChat={openDeleteDialog}
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
  );
}

export default Sidebar;
