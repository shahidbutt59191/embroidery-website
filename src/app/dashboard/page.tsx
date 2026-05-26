import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import WalletCard from "./WalletCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile (for wallet balance)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Fetch Orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, created_at, status, total_price,
      gigs (title, image_url)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const activeOrders = orders?.filter(o => o.status === 'pending' || o.status === 'in_progress' || o.status === 'delivered') || [];
  const pastOrders = orders?.filter(o => o.status === 'completed' || o.status === 'cancelled') || [];

  return (
    <div className="min-h-screen bg-accent/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <h1 className="text-3xl font-bold font-outfit text-foreground mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Wallet */}
          <div className="lg:col-span-1 space-y-6">
            <WalletCard balance={profile?.wallet_balance || 0} userId={user.id} />
            
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-2">Need a new design?</h3>
              <p className="text-sm text-muted-foreground mb-4">Browse our services and place a new order today.</p>
              <Link href="/#services" className="w-full flex justify-center py-2 bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors font-medium rounded-xl">
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
              
              <div className="space-y-4">
                {activeOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-border border-dashed text-center text-muted-foreground">
                    You have no active orders.
                  </div>
                ) : (
                  activeOrders.map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-2xl border border-border shadow-sm hover:border-primary/50 transition-colors overflow-hidden">
                      <div className="p-4 flex items-center gap-4">
                        <img src={(order.gigs as any)?.image_url} alt="Gig" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{(order.gigs as any)?.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>Order #{order.id.split('-')[0]}</span>
                            <span>•</span>
                            <span className="font-medium text-secondary">${order.total_price}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                            order.status === 'delivered' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-xl font-bold font-outfit text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> Completed Orders
                </h2>
                <div className="space-y-4">
                  {pastOrders.map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white/50 rounded-2xl border border-border shadow-sm hover:border-border/80 transition-colors opacity-75 hover:opacity-100 overflow-hidden">
                      <div className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm">{(order.gigs as any)?.title}</h3>
                          <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium text-foreground text-sm">
                          ${order.total_price}
                        </div>
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
