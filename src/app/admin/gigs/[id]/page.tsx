import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import PropertyManager from "./PropertyManager";

export default async function GigDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const gigId = resolvedParams.id;
  const supabase = await createClient();

  // Fetch the gig
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .single();

  if (gigError || !gig) {
    return <div className="text-red-600 p-8">Gig not found or error loading gig.</div>;
  }

  // Fetch properties and their options
  const { data: properties, error: propsError } = await supabase
    .from("gig_properties")
    .select(`
      *,
      gig_property_options (*)
    `)
    .eq("gig_id", gigId)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/gigs" className="p-2 hover:bg-accent rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-outfit text-primary">{gig.title}</h1>
          <p className="text-muted-foreground">Manage properties and options for this service.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gig Details Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary" />
              Gig Details
            </h2>
            {gig.image_url && (
              <img src={gig.image_url} alt={gig.title} className="w-full h-32 object-cover rounded-xl mb-4" />
            )}
            <p className="text-sm text-foreground mb-4">{gig.description}</p>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Base Price:</span>
              <span className="text-primary text-lg">${gig.base_price}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${gig.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {gig.is_active ? "Status: Active" : "Status: Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Properties Management */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold font-outfit text-primary">Custom Properties</h2>
            </div>
            
            <PropertyManager 
              gigId={gig.id} 
              initialProperties={properties || []} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
