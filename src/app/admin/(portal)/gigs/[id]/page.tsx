import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import PropertyManager from "./PropertyManager";
import GigForm from "../new/GigForm";

export default async function GigDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gigId } = await params;
  const supabase = await createClient();

  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .single();

  if (gigError || !gig) {
    return <div className="text-red-600 p-8">Gig not found or error loading gig.</div>;
  }

  // Try to load extra images from gig_images table (may not exist yet)
  let extraImages: string[] = [];
  try {
    const { data } = await supabase
      .from("gig_images")
      .select("image_url")
      .eq("gig_id", gigId)
      .order("sort_order", { ascending: true });
    extraImages = (data || []).map((r: any) => r.image_url);
  } catch (_) {}

  const allImages = [
    ...(gig.image_url ? [gig.image_url] : []),
    ...extraImages,
  ];

  const { data: properties } = await supabase
    .from("gig_properties")
    .select("*, gig_property_options (*)")
    .eq("gig_id", gigId)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/gigs" className="p-2 hover:bg-white rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-outfit text-primary">Edit Gig</h1>
          <p className="text-muted-foreground">Update gig details, images, and order properties.</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-secondary" /> Gig Details
        </h2>
        <GigForm
          gigId={gigId}
          defaultValues={{
            title: gig.title,
            description: gig.description || "",
            basePrice: String(gig.base_price),
            images: allImages,
          }}
        />
      </div>

      {/* Properties */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h2 className="text-xl font-semibold font-outfit text-primary mb-6">Order Form Properties</h2>
        <PropertyManager gigId={gig.id} initialProperties={properties || []} />
      </div>
    </div>
  );
}
