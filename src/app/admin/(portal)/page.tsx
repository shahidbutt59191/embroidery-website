import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, MessageSquare, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: completedOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("orders")
      .select(`id, status, total_price, created_at, gigs(title), profiles!customer_id(full_name, email)`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Total Orders", value: totalOrders ?? 0, icon: Package, color: "bg-blue-500" },
    { label: "Pending", value: pendingOrders ?? 0, icon: Clock, color: "bg-yellow-500" },
    { label: "Completed", value: completedOrders ?? 0, icon: CheckCircle2, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your digitizing business.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/orders" className="bg-white border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group shadow-sm">
          <Package className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground text-lg">Manage Orders</h3>
          <p className="text-sm text-muted-foreground mt-1">View, update status, and upload digitized files.</p>
        </Link>
        <Link href="/admin/chat" className="bg-white border border-border rounded-2xl p-6 hover:border-secondary/50 transition-colors group shadow-sm">
          <MessageSquare className="w-8 h-8 text-secondary mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-foreground text-lg">Customer Chat</h3>
          <p className="text-sm text-muted-foreground mt-1">Communicate with customers about their orders.</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg font-outfit text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {recentOrders?.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-accent/10 transition-colors">
              <div>
                <p className="font-semibold text-foreground text-sm">{(order.gigs as any)?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">by {(order.profiles as any)?.full_name || "Customer"} · {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-foreground">${order.total_price}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                  order.status === 'completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{order.status.replace('_', ' ')}</span>
              </div>
            </Link>
          ))}
          {(!recentOrders || recentOrders.length === 0) && (
            <div className="p-12 text-center text-muted-foreground">No orders yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
