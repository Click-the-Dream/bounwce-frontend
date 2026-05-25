"use client";
import { generatePageMetadata } from "@/app/_utils/metadata";
import SecureRoute from "@/app/protocols/SecureRoutes";
import { NotificationProvider } from "@/app/context/NotificationContext";
import { ChatProvider } from "@/app/context/ChatContext";
import AdminSidebar from "./Sidebar";
import { PAGE_TITLES, STORES, VENDORS } from "@/app/_utils/mock";
import { Page } from "@/app/_utils/types/admin";
import { Bell, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const metadata = generatePageMetadata({
  title: "Admin Dashboard | Bouwnce",
  description: "",
});

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [page, setPage] = useState<Page>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingCount =
    VENDORS.filter((v) => v.status === "pending").length +
    STORES.filter((s) => s.status === "pending").length;

  return (
    <SecureRoute>
      <NotificationProvider>
        <ChatProvider>
          <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* ── Sidebar ── */}
            <AdminSidebar onClose={() => setSidebarOpen(false)} />

            {/* Mobile Sidebar */}
            <div
              className={`fixed inset-0 z-40 lg:hidden transition ${
                sidebarOpen ? "visible" : "invisible"
              }`}
            >
              {/* Overlay */}
              <div
                className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${
                  sidebarOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={() => setSidebarOpen(false)}
              />

              {/* Drawer */}
              <div
                className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <AdminSidebar isMobile onClose={() => setSidebarOpen(false)} />
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Topbar */}
              <header className="h-13.75 bg-white border-b border-[#00000033] px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen((o) => !o)}
                    className="block md:hidden text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Menu size={20} />
                  </button>
                  <h1 className="text-base font-semibold text-slate-900">
                    {PAGE_TITLES[page]}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative hidden sm:block">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      placeholder="Search anything…"
                      className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 w-52 transition-all"
                    />
                  </div>
                  {/* Bell */}
                  <button className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
                    <Bell size={17} />
                    {pendingCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </div>
              </header>

              {/* Content */}
              <main className="flex-1 overflow-y-auto p-2">{children}</main>
            </div>
          </div>
        </ChatProvider>
      </NotificationProvider>
    </SecureRoute>
  );
};

export default AdminLayout;
