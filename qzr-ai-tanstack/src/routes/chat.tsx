import { Outlet, createFileRoute } from "@tanstack/react-router";
import Sidebar from "#/features/Sidebar";

export const Route = createFileRoute("/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-88">
      <Sidebar expanded />
      <main className="min-h-screen px-2 py-3 sm:p-5 md:px-8 md:py-6">
        <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-7xl rounded-xl border-2 border-black bg-[#fff333] p-3 shadow-[6px_6px_0_rgb(0_0_0/0.12)] sm:min-h-[calc(100vh-2.5rem)] sm:p-5 md:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
