import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import Sidebar from "#/features/Sidebar";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-72 md:has-[.sidebar-collapsed]:pl-18">
      <Sidebar expanded />
      <main className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 md:px-8">
        <section className="w-full max-w-xl text-center">
          <p className="m-0 text-[0.7rem] font-black tracking-[0.18em] text-black/35">
            404
          </p>
          <h1 className="mt-2 mb-0 text-3xl font-black sm:text-4xl">
            Pagina non trovata
          </h1>
          <p className="mx-auto mt-3 mb-0 max-w-md text-sm font-medium text-black/55">
            Forse cercavi una chat, un documento o la home?
          </p>

          <Link
            to="/"
            className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-bold text-[#fff333] no-underline transition hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} />
            Torna alla home
          </Link>
        </section>
      </main>
    </div>
  );
}
