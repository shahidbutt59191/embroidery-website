import { Search, Filter, SlidersHorizontal, ChevronDown, Star, Heart, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Marketplace | StitchMarket",
  description: "Browse premium embroidery digitizing and design services",
};

export default async function MarketplacePage() {
  const supabase = await createClient();

  // 1. Check Auth Status
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Active Gigs from Database
  const { data: gigs } = await supabase
    .from('gigs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // 3. Logout Action
  const handleSignOut = async () => {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="bg-accent/20 min-h-screen py-8">
      <div className="container mx-auto px-4">

        {/* Top Bar: User Info & Logout */}
        <div className="flex justify-end items-center gap-4 mb-6">
          <Link href="/orders" className="text-sm font-medium text-primary hover:underline">
            My Orders
          </Link>
          <span className="text-sm font-medium text-muted-foreground">
            Logged in as: <strong className="text-foreground">{user.email}</strong>
          </span>
          <form action={handleSignOut}>
            <button type="submit" className="flex items-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>

        {/* Header & Search */}
        <div className="bg-primary rounded-2xl p-8 mb-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-outfit">Embroidery Marketplace</h1>
            <p className="text-white/80 mb-6 max-w-2xl">Find the perfect digitizing service for your next embroidery project.</p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for '3D puff', 'jacket back', etc..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <button className="bg-secondary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors whitespace-nowrap">
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{gigs?.length || 0}</span> services available
        </div>

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gigs?.map((gig) => (
            <Link key={gig.id} href={`/gig/${gig.id}`} className="group block bg-white rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={gig.image_url || "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80"}
                  alt={gig.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-100"
                />
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                  <Heart size={18} />
                </button>
              </div>

              <div className="p-5 flex-1">
                <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {gig.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {gig.description}
                </p>
              </div>

              <div className="px-5 py-4 border-t border-border flex justify-between items-center bg-accent/10 mt-auto">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Starting At</span>
                <span className="font-bold text-xl text-primary">${gig.base_price}</span>
              </div>
            </Link>
          ))}
          
          {(!gigs || gigs.length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed border-border">
              No services available right now. Please check back later!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}