import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare, Package } from "lucide-react";
import AdminChatClient from "./AdminChatClient";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedOrderId = resolvedParams.order ?? null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all orders with customer info and last message
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, status, total_price, created_at,
      gigs (title),
      profiles!orders_customer_id_fkey (full_name, email)
    `)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  // Fetch unread message counts per order
  const { data: unreadCounts } = await supabase
    .from("chat_messages")
    .select("order_id")
    .eq("is_read", false)
    .neq("sender_id", user.id);

  const unreadMap: Record<string, number> = {};
  unreadCounts?.forEach((m) => {
    unreadMap[m.order_id] = (unreadMap[m.order_id] || 0) + 1;
  });

  const enrichedOrders = (orders || []).map((o: any) => ({
    id: o.id,
    status: o.status,
    total_price: o.total_price,
    created_at: o.created_at,
    gig_title: o.gigs?.title ?? "Unknown Gig",
    customer_name: o.profiles?.full_name || o.profiles?.email || "Customer",
    unread: unreadMap[o.id] ?? 0,
  }));

  const selectedOrder = enrichedOrders.find((o) => o.id === selectedOrderId) ?? null;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-outfit text-primary">Customer Chat</h1>
        <p className="text-muted-foreground mt-1">Communicate with customers in real-time.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar: Order List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-accent/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {enrichedOrders.length} Active Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {enrichedOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders yet.</p>
              </div>
            ) : (
              enrichedOrders.map((order) => (
                <a
                  key={order.id}
                  href={`/admin/chat?order=${order.id}`}
                  className={`block px-4 py-3.5 hover:bg-accent/30 transition-colors cursor-pointer ${
                    order.id === selectedOrderId ? "bg-primary/5 border-l-2 border-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{order.gig_title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">
                        #{order.id.split("-")[0]} · {order.status.replace("_", " ")}
                      </p>
                    </div>
                    {order.unread > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                        {order.unread}
                      </span>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-0">
          {selectedOrder ? (
            <AdminChatClient
              orderId={selectedOrder.id}
              adminId={user.id}
              customerName={selectedOrder.customer_name}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">Select a conversation</p>
                <p className="text-sm mt-1">Choose an order from the left to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
