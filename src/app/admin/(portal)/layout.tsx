import Link from "next/link";
import { LayoutDashboard, Scissors, ListOrdered, MessageSquare, Bell } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";
import AdminTopBar from "./AdminTopBar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Unread message count for sidebar badge
  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", user.id)
      .eq("is_read", false);
    unreadCount = count || 0;
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/gigs", icon: Scissors, label: "Manage Services" },
    { href: "/admin/orders", icon: ListOrdered, label: "Orders" },
    { href: "/admin/chat", icon: MessageSquare, label: "Inbox", badge: unreadCount },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 fixed h-full z-20">

        {/* Logo + admin controls */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
                <span className="font-black text-white text-sm">S</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm leading-tight">StitchMarket</h2>
                <p className="text-[10px] text-white/40 font-medium">Admin Portal</p>
              </div>
            </div>
            {/* Notification bell + inbox icon */}
            {user && <AdminTopBar />}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 pb-2 pt-1">
            Management
          </p>
          {navItems.map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/8 hover:text-white transition-all font-medium text-sm group"
            >
              <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="flex-1">{label}</span>
              {badge && badge > 0 && (
                <span className="min-w-[20px] h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 pb-2">
              Notifications
            </p>
            <Link
              href="/admin/notifications"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/8 hover:text-white transition-all font-medium text-sm group"
            >
              <Bell className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span>All Notifications</span>
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            ↗ View Website
          </Link>
          <div className="px-3">
            <LogoutButton variant="dark" />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
