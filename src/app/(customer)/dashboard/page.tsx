import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ArrowRight, CheckCircle2, MessageSquare, Plus, Wallet } from "lucide-react";
import WalletCard from "./WalletCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const { data: orders } = await supabase
    .from('orders')
    .select(`id, created_at, status, total_price, gigs (title, image_url)`)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  // Get unread message counts per order
  const { data: unreadMsgs } = await supabase
    .from('chat_messages')
    .select('order_id')
    .neq('sender_id', user.id)
    .eq('is_read', false);

  const unreadMap: Record<string, number> = {};
  unreadMsgs?.forEach((m) => {
    unreadMap[m.order_id] = (unreadMap[m.order_id] || 0) + 1;
  });

  const activeOrders = orders?.filter(o => ['pending', 'in_review', 'in_progress', 'delivered'].includes(o.status)) || [];
  const pastOrders = orders?.filter(o => o.status === 'completed' || o.status === 'cancelled') || [];

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-accent/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Manage your orders and communicate with your digitizer.</p>
          </div>
          <Link
            href="/#services"
            className="hidden sm:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <WalletCard balance={profile?.wallet_balance || 0} userId={user.id} />

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-foreground">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Active</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{pastOrders.length}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Completed</p>
                </div>
              </div>
              {totalUnread > 0 && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 text-secondary" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {totalUnread}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-secondary">
                    {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Support Box */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-border shadow-sm p-5">
              <MessageSquare className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-bold text-foreground mb-1">Need help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with your digitizer directly from any active order page.
              </p>
              <Link
                href="/#services"
                className="block text-center py-2 bg-white text-primary border border-primary/20 hover:bg-primary/5 transition-colors font-medium rounded-xl text-sm"
              >
                Browse Services
              </Link>
            </div>
          </div>

          {/* Right Column: Orders */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Orders */}
            <section>
              <h2 className="text-xl font-bold font-outfit text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Active Orders
              </h2>

              <div className="space-y-3">
                {activeOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 border border-border border-dashed text-center">
                    <Package className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-muted-foreground">No active orders yet.</p>
                    <Link href="/#services" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">
                      Place your first order →
                    </Link>
                  </div>
                ) : (
                  activeOrders.map(order => {
                    const unread = unreadMap[order.id] ?? 0;
                    return (
                      <div key={order.id} className="bg-white rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-colors overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <img
                            src={(order.gigs as any)?.image_url || "https://placehold.co/64x64/e2e8f0/94a3b8?text=Gig"}
                            alt="Gig"
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{(order.gigs as any)?.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span>#{order.id.split('-')[0]}</span>
                              <span>·</span>
                              <span className="font-semibold text-foreground">${parseFloat(order.total_price).toFixed(2)}</span>
                              <span>·</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                order.status === 'delivered'   ? 'bg-blue-100 text-blue-700' :
                                order.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'in_review'   ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-shrink-0">
                            <Link
                              href={`/orders/${order.id}#chat`}
                              className="relative p-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                              title="Chat with digitizer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                  {unread}
                                </span>
                              )}
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
                        {/* Delivered Action Bar */}
                        {order.status === 'delivered' && (
                          <div className="px-4 pb-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="block w-full text-center py-2.5 bg-secondary text-white rounded-xl font-semibold text-sm hover:bg-secondary/90 transition-colors"
                            >
                              ✓ Review & Approve Payment →
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-xl font-bold font-outfit text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> Order History
                </h2>
                <div className="space-y-3">
                  {pastOrders.map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-4 bg-white/60 rounded-2xl border border-border p-4 hover:bg-white hover:border-border/80 transition-all opacity-80 hover:opacity-100">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{(order.gigs as any)?.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{order.status}</span>
                        <span className="font-bold text-foreground text-sm">${parseFloat(order.total_price).toFixed(2)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
