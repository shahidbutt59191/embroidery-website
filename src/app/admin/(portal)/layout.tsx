import Link from "next/link";
import { LayoutDashboard, Scissors, ListOrdered, MessageSquare } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

// This layout wraps all protected admin pages (/admin, /admin/gigs, /admin/orders, /admin/chat)
// The login page is intentionally OUTSIDE this folder so it gets no sidebar.
export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 fixed h-full">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <div>
              <h2 className="font-bold font-outfit text-white leading-tight">StitchMarket</h2>
              <p className="text-xs text-white/40">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pb-2 pt-3">
            Management
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/admin/gigs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
          >
            <Scissors className="w-4 h-4 flex-shrink-0" />
            Manage Gigs
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
          >
            <ListOrdered className="w-4 h-4 flex-shrink-0" />
            Orders
          </Link>
          <Link
            href="/admin/chat"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm"
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            Customer Chat
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            ← Back to Website
          </Link>
          <div className="px-3">
            <LogoutButton variant="dark" />
          </div>
        </div>
      </aside>

      {/* Main Content — offset by sidebar width */}
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
