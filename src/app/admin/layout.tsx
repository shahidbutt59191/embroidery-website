import Link from "next/link";
import { LayoutDashboard, Scissors, ListOrdered, MessageSquare, Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-accent/20">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold font-outfit text-primary">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/50 hover:text-primary transition-colors font-medium">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/gigs" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/50 hover:text-primary transition-colors font-medium">
            <Scissors className="w-5 h-5" />
            <span>Manage Gigs</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/50 hover:text-primary transition-colors font-medium">
            <ListOrdered className="w-5 h-5" />
            <span>Orders</span>
          </Link>
          <Link href="/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/50 hover:text-secondary transition-colors font-medium">
            <MessageSquare className="w-5 h-5" />
            <span>Customer Chat</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Back to Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
