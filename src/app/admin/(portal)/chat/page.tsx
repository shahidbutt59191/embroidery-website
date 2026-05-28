import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare, Package, Headphones } from "lucide-react";
import AdminChatClient from "./AdminChatClient";

export default async function AdminChatPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; support?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedOrderId = resolvedParams.order ?? null;
  const selectedSupportId = resolvedParams.support ?? null; // customer_id for support chat

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Fetch all orders with customer info
  const { data: orders } = await supabase
    .from("orders")
    .select(`id, status, total_price, created_at, gigs (title), profiles!customer_id (full_name, email)`)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  // Fetch support chats (null order_id messages grouped by customer)
  const { data: supportMessages } = await supabase
    .from("chat_messages")
    .select("customer_id, created_at, profiles!chat_messages_sender_id_fkey(full_name, email)")
    .is("order_id", null)
    .order("created_at", { ascending: false });

  // Deduplicate support customers
  const supportCustomers: Record<string, { customerId: string; name: string; lastAt: string }> = {};
  supportMessages?.forEach((m: any) => {
    if (m.customer_id && !supportCustomers[m.customer_id]) {
      supportCustomers[m.customer_id] = {
        customerId: m.customer_id,
        name: m.profiles?.full_name || m.profiles?.email || "Customer",
        lastAt: m.created_at,
      };
    }
  });
  const supportList = Object.values(supportCustomers);

  // Unread counts for orders
  const { data: unreadCounts } = await supabase
    .from("chat_messages")
    .select("order_id, customer_id")
    .eq("is_read", false)
    .neq("sender_id", user.id);

  const unreadOrderMap: Record<string, number> = {};
  const unreadSupportMap: Record<string, number> = {};
  unreadCounts?.forEach((m: any) => {
    if (m.order_id) unreadOrderMap[m.order_id] = (unreadOrderMap[m.order_id] || 0) + 1;
    else if (m.customer_id) unreadSupportMap[m.customer_id] = (unreadSupportMap[m.customer_id] || 0) + 1;
  });

  const enrichedOrders = (orders || []).map((o: any) => ({
    id: o.id,
    status: o.status,
    gig_title: o.gigs?.title ?? "Unknown Gig",
    customer_name: o.profiles?.full_name || o.profiles?.email || "Customer",
    unread: unreadOrderMap[o.id] ?? 0,
  }));

  const selectedOrder = enrichedOrders.find((o) => o.id === selectedOrderId) ?? null;
  const selectedSupport = supportList.find((s) => s.customerId === selectedSupportId) ?? null;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-outfit text-primary">Customer Chat</h1>
        <p className="text-muted-foreground mt-1">Communicate with customers in real-time.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">

          {/* Support Section */}
          {supportList.length > 0 && (
            <>
              <div className="px-4 py-2.5 border-b border-border bg-secondary/5">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" /> General Support ({supportList.length})
                </p>
              </div>
              <div className="divide-y divide-border border-b border-border">
                {supportList.map((s) => (
                  <a
                    key={s.customerId}
                    href={`/admin/chat?support=${s.customerId}`}
                    className={`block px-4 py-3 hover:bg-secondary/5 transition-colors ${
                      s.customerId === selectedSupportId ? "bg-secondary/10 border-l-2 border-secondary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                        <p className="text-[10px] text-secondary font-medium mt-0.5">Support Chat</p>
                      </div>
                      {unreadSupportMap[s.customerId] > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                          {unreadSupportMap[s.customerId]}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Orders Section */}
          <div className="px-4 py-2.5 border-b border-border bg-accent/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Order Chats ({enrichedOrders.length})
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
                  className={`block px-4 py-3.5 hover:bg-accent/30 transition-colors ${
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
                      <span className="flex-shrink-0 min-w-[20px] h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
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
          ) : selectedSupport ? (
            <AdminChatClient
              orderId={null}
              adminId={user.id}
              customerName={selectedSupport.name}
              customerId={selectedSupport.customerId}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">Select a conversation</p>
                <p className="text-sm mt-1">Choose an order or support chat from the left.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
