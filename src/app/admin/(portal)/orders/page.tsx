import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Package, MessageSquare, ArrowRight, Clock, CheckCircle2, RotateCcw, Truck } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:            { label: "Pending",           color: "bg-yellow-100 text-yellow-700" },
  in_review:          { label: "In Review",         color: "bg-orange-100 text-orange-700" },
  in_progress:        { label: "In Progress",       color: "bg-purple-100 text-purple-700" },
  revision_requested: { label: "Revision Requested",color: "bg-red-100 text-red-700"    },
  delivered:          { label: "Delivered",         color: "bg-blue-100 text-blue-700"   },
  completed:          { label: "Completed",         color: "bg-green-100 text-green-700" },
  cancelled:          { label: "Cancelled",         color: "bg-gray-100 text-gray-600"   },
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, status, total_price, created_at, special_instructions,
      gigs (title, image_url),
      profiles!orders_customer_id_fkey (full_name, email)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-primary">All Orders</h1>
        <p className="text-muted-foreground mt-1">{orders?.length ?? 0} orders total</p>
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
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Customer: <span className="font-medium text-foreground">{(order.profiles as any)?.full_name || (order.profiles as any)?.email || "Unknown"}</span>
                      <span className="mx-2">·</span>
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
