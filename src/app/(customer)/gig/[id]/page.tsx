import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Star, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import GigPackagePanel from "./GigPackagePanel";
import GigGallery from "./GigGallery";

// ── render markdown-like inline formatting ───────────────────
function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, ==highlight==
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|==(.+?)==/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="italic">{match[4]}</em>);
    else if (match[5]) parts.push(<mark key={match.index} className="bg-yellow-200 px-0.5 rounded not-italic">{match[5]}</mark>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default async function CustomerGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gigId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: gig, error: gigError } = await supabase
    .from("gigs").select("*").eq("id", gigId).single();

  if (gigError || !gig || !gig.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
          <Link href="/#services" className="text-primary hover:underline">Return to Services</Link>
        </div>
      </div>
    );
  }

  // Load extra images from gig_images table
  let extraImages: string[] = [];
  try {
    const { data } = await supabase
      .from("gig_images").select("image_url").eq("gig_id", gigId).order("sort_order", { ascending: true });
    extraImages = (data || []).map((r: any) => r.image_url);
  } catch (_) {}

  const allImages = [
    ...(gig.image_url ? [gig.image_url] : []),
    ...extraImages,
  ];

  const { data: properties } = await supabase
    .from("gig_properties").select("*, gig_property_options (*)").eq("gig_id", gigId)
    .order("sort_order", { ascending: true });

  const descriptionLines = (gig.description || "").split("\n").filter(Boolean);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/#services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug mb-4">
              {gig.title}
            </h1>

            {/* Seller row */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                SM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">StitchMarket</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Level 2</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-gray-800">5.0</span>
                  <span className="text-xs text-gray-400">(128 reviews)</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <span className="text-xs text-gray-500">3 orders in queue</span>
                </div>
              </div>
            </div>

            {/* Image Gallery — passes all images */}
            <GigGallery images={allImages} title={gig.title} />

            {/* About This Gig */}
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About This Gig</h2>
              <div className="text-sm text-gray-700 leading-relaxed space-y-2.5">
                {descriptionLines.map((line: string, i: number) => {
                  const isBullet = /^[-*•]\s/.test(line);
                  const isNumbered = /^\d+\.\s/.test(line);

                  if (isBullet) {
                    const content = line.replace(/^[-*•]\s/, "");
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5 flex-shrink-0">✓</span>
                        <span>{renderInline(content)}</span>
                      </div>
                    );
                  }
                  if (isNumbered) {
                    const num = line.match(/^\d+/)?.[0];
                    const content = line.replace(/^\d+\.\s*/, "");
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary font-semibold flex-shrink-0 min-w-[20px]">{num}.</span>
                        <span>{renderInline(content)}</span>
                      </div>
                    );
                  }
                  return <p key={i}>{renderInline(line)}</p>;
                })}
                {descriptionLines.length === 0 && (
                  <p className="text-gray-400 italic">Description coming soon.</p>
                )}
              </div>
            </div>

            {/* What's Included */}
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck, label: "High-quality digitizing output" },
                  { icon: Clock, label: "Fast 24-hour turnaround" },
                  { icon: RefreshCw, label: "Unlimited free revisions" },
                  { icon: ShieldCheck, label: "All machine formats (.DST .PES .JEF +)" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN — Sticky Package Panel ─────── */}
          <div className="w-full lg:w-[340px] flex-shrink-0">
            <div className="sticky top-16">
              <GigPackagePanel
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
