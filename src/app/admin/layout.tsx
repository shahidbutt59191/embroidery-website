import Link from "next/link";
import { LayoutDashboard, Scissors, ListOrdered, MessageSquare, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-accent/20">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold font-outfit text-primary">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 hover:text-primary transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 hover:text-primary transition-colors">
            <Scissors className="w-5 h-5" />
            <span className="font-medium">Manage Gigs</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 hover:text-primary transition-colors">
            <ListOrdered className="w-5 h-5" />
            <span className="font-medium">Orders</span>
          </Link>
          <Link href="/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent/50 hover:text-primary transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Chat</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
