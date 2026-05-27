import { createClient } from "@/lib/supabase/server";
import LandingPageClient from "./LandingPageClient";

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: gigs } = await supabase
    .from("gigs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const gigList = gigs || [];

  // First gig is the featured one; all gigs go to the All Services tab
  const featuredGig = gigList[0] ?? null;

  if (featuredGig) {
    try {
      const { data: images } = await supabase
        .from("gig_images")
        .select("image_url")
        .eq("gig_id", featuredGig.id)
        .order("sort_order", { ascending: true });
      featuredGig.extraImages = (images || []).map((img) => img.image_url);
    } catch (err) {}
  }

  return (
    <LandingPageClient
      featuredGig={featuredGig}
      allGigs={gigList}
    />
  );
}