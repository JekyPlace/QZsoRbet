import Sidebar from "#/features/Sidebar";
import HomeCreatingState from "./HomeCreatingState";
import HomePromptComposer from "./HomePromptComposer";
import { useHomePage } from "./homePage.brain";

export default function HomePage() {
  const home = useHomePage();

  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-72 md:has-[.sidebar-collapsed]:pl-18">
      <Sidebar expanded={true} />
      <main className="grid min-h-screen place-items-center px-3 py-6 sm:px-6 md:p-8">
        {home.isCreating ? (
          <HomeCreatingState />
        ) : (
          <HomePromptComposer {...home} />
        )}
      </main>
    </div>
  );
}
