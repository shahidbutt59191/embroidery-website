import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxClient from "./InboxClient";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv: selectedConvId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All orders for this customer (these are the "conversations")
  const { data: orders } = await supabase
    .from("orders")
    .select(`id, status, total_price, created_at, gigs (title, image_url)`)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  // Unread message counts per order
  const { data: unreadMsgs } = await supabase
    .from("chat_messages")
    .select("order_id")
    .eq("customer_id", user.id)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  const unreadMap: Record<string, number> = {};
  unreadMsgs?.forEach((m: any) => {
    if (m.order_id) unreadMap[m.order_id] = (unreadMap[m.order_id] || 0) + 1;
  });

  // Check for support chat (messages with null order_id from/to this customer)
  const { data: supportMsgs } = await supabase
    .from("chat_messages")
    .select("id, is_read, sender_id")
    .eq("customer_id", user.id)
    .is("order_id", null)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  const supportUnread = supportMsgs?.length ?? 0;

  const conversations = (orders || []).map((o: any) => ({
    id: o.id,
    type: "order" as const,
    title: o.gigs?.title ?? "Order",
    subtitle: `#${o.id.split("-")[0].toUpperCase()} · ${o.status.replace(/_/g, " ")}`,
    image: o.gigs?.image_url ?? null,
    status: o.status,
    unread: unreadMap[o.id] ?? 0,
    amount: parseFloat(o.total_price),
    created_at: o.created_at,
  }));

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <InboxClient
      conversations={conversations}
      supportUnread={supportUnread}
      selectedConvId={selectedConvId ?? null}
      userId={user.id}
      userName={profile?.full_name || profile?.email || "You"}
    />
  );
}
