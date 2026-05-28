import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, MessageSquare, ArrowRight, Clock, CheckCircle2, RotateCcw, Truck, LayoutList, Loader2, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:            { label: "Pending",           color: "bg-yellow-100 text-yellow-700" },
  in_review:          { label: "In Review",         color: "bg-orange-100 text-orange-700" },
  in_progress:        { label: "In Progress",       color: "bg-purple-100 text-purple-700" },
  revision_requested: { label: "Revision Requested",color: "bg-red-100 text-red-700"    },
  delivered:          { label: "Delivered",         color: "bg-blue-100 text-blue-700"   },
  completed:          { label: "Completed",         color: "bg-green-100 text-green-700" },
  cancelled:          { label: "Cancelled",         color: "bg-gray-100 text-gray-600"   },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { tab = "all" } = await searchParams;

  let query = supabase
    .from("orders")
    .select(`
      id, status, total_price, created_at, delivery_deadline, special_instructions,
      gigs (title, image_url),
      profiles!orders_customer_id_fkey (full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (tab !== "all") {
    query = query.eq("status", tab);
  }

  const { data: orders, error } = await query;

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "in_progress", label: "In Progress" },
    { id: "delivered", label: "Delivered" },
    { id: "completed", label: "Completed" },
  ];

  // Calculate Stats across ALL orders, so we need a separate query if tab is not "all", 
  // but for simplicity we will just fetch all stats first.
  const { data: allOrders } = await supabase.from("orders").select("status, total_price");
  const stats = {
    active: allOrders?.filter(o => o.status === "in_progress" || o.status === "pending").length || 0,
    completed: allOrders?.filter(o => o.status === "completed" || o.status === "delivered").length || 0,
    revenue: allOrders?.filter(o => o.status === "completed").reduce((sum, o) => sum + parseFloat(o.total_price), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-primary flex items-center gap-2">
            <LayoutList className="w-8 h-8" />
            Order Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">${stats.revenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-border">
        {tabs.map(t => (
          <Link
            key={t.id}
            href={`/admin/orders?tab=${t.id}`}
            className={`px-4 py-2 font-medium text-sm rounded-t-xl transition-colors whitespace-nowrap border-b-2 ${
              tab === t.id 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">{error.message}</div>
      )}

      <div className="space-y-4">
        {(!orders || orders.length === 0) && !error ? (
          <div className="bg-white rounded-2xl border border-border border-dashed p-16 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No orders yet.</p>
          </div>
        ) : (
          orders?.map((order: any) => {
            const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img
                    src={(order.gigs as any)?.image_url || "https://placehold.co/64x64/e2e8f0/94a3b8?text=Gig"}
                    alt="Gig"
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{(order.gigs as any)?.title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                      {order.delivery_deadline && order.status === "in_progress" && (
                        <CountdownTimer deadline={order.delivery_deadline} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Customer: <span className="font-medium text-foreground">{(order.profiles as any)?.full_name || (order.profiles as any)?.email || "Unknown"}</span>
                      <span className="mx-2">·</span>
                      Placed: {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {order.special_instructions && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg italic">"{order.special_instructions}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xl font-bold text-foreground">${parseFloat(order.total_price).toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/chat?order=${order.id}`}
                        className="p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                        title="Chat with customer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/orders/${order.id}`}
                        className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="View order details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
