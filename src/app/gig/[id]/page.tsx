import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OrderForm from "./OrderForm";

export default async function CustomerGigPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const gigId = resolvedParams.id;
  const supabase = await createClient();

  // Check Auth Status
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the gig
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .single();

  if (gigError || !gig || !gig.is_active) {
    return (
      <div className="min-h-screen bg-accent/20 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
        <Link href="/#services" className="text-primary hover:underline">
          Return to Services
        </Link>
      </div>
    );
  }

  // Fetch properties and their options
  const { data: properties } = await supabase
    .from("gig_properties")
    .select(`
      *,
      gig_property_options (*)
    `)
    .eq("gig_id", gigId)
    .order("sort_order", { ascending: true });

  return (
    <div className="bg-accent/20 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/#services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Gig Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <img 
                src={gig.image_url || "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80"} 
                alt={gig.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h1 className="text-2xl font-bold font-outfit text-primary mb-2">{gig.title}</h1>
                <p className="text-sm text-muted-foreground mb-6">{gig.description}</p>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-semibold text-foreground">Base Price</span>
                  <span className="font-bold text-2xl text-secondary">${gig.base_price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Order Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6 text-foreground border-b border-border pb-4">Customize Your Order</h2>
              
              <OrderForm 
                gig={gig} 
                properties={properties || []} 
                userId={user?.id || null} 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
