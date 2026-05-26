import Link from "next/link";
import { LayoutDashboard, Scissors, ListOrdered, MessageSquare } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth is handled by middleware — no redirect needed here
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <div>
              <h2 className="font-bold font-outfit text-white">StitchMarket</h2>
              <p className="text-xs text-white/50">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-3 pb-2 pt-2">
            Management
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors font-medium text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/gigs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors font-medium text-sm"
          >
            <Scissors className="w-4 h-4" />
            Manage Gigs
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors font-medium text-sm"
          >
            <ListOrdered className="w-4 h-4" />
            Orders
          </Link>
          <Link
            href="/admin/chat"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors font-medium text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Customer Chat
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 transition-colors text-xs"
          >
            ← Back to Website
          </Link>
          <div className="px-3">
            <LogoutButton variant="dark" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
