import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Star, BadgeCheck, Clock, Repeat2, Shield, Zap } from "lucide-react";
import GigPackagePanel from "./GigPackagePanel";
import GigGallery from "./GigGallery";

// Inline markdown renderer
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|==(.+?)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} className="font-bold text-foreground">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={k++} className="italic">{m[4]}</em>);
    else if (m[5]) parts.push(<mark key={k++} className="bg-secondary/20 text-secondary px-1 rounded not-italic font-medium">{m[5]}</mark>);
    last = m.index + m[0].length;
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
      <div className="min-h-screen flex items-center justify-center bg-accent/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
          <Link href="/#services" className="text-primary hover:underline">Return to Services</Link>
        </div>
      </div>
    );
  }

  let extraImages: string[] = [];
  try {
    const { data } = await supabase
      .from("gig_images").select("image_url").eq("gig_id", gigId)
      .order("sort_order", { ascending: true });
    extraImages = (data || []).map((r: any) => r.image_url);
  } catch (_) {}

  const allImages = [...(gig.image_url ? [gig.image_url] : []), ...extraImages];

  const { data: properties } = await supabase
    .from("gig_properties").select("*, gig_property_options (*)")
    .eq("gig_id", gigId).order("sort_order", { ascending: true });

  const descLines = (gig.description || "").split("\n").filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f6ff 0%, #fff 60%)" }}>

      {/* ── TOP HERO BAND */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary/80 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/#services" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Services
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-sm text-white/90 truncate max-w-xs">{gig.title}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col xl:flex-row gap-10">

          {/* ══ LEFT COLUMN ══════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Title Card */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4">
                {gig.title}
              </h1>

              {/* Seller strip */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20">
                    SM
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-foreground">StitchMarket</span>
                      <BadgeCheck className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">Expert Digitizer</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-sm font-bold text-foreground ml-1">5.0</span>
                  <span className="text-xs text-muted-foreground ml-0.5">(128)</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                  3 orders in queue
                </div>
              </div>
            </div>

            {/* Gallery */}
            <GigGallery images={allImages} title={gig.title} />

            {/* Trust badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Zap, label: "Fast Delivery", sub: "As quick as 1 day" },
                { icon: Repeat2, label: "Free Revisions", sub: "Until you're happy" },
                { icon: Shield, label: "All Formats", sub: ".DST .PES .JEF +" },
                { icon: BadgeCheck, label: "Expert Quality", sub: "5★ rated service" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-border shadow-sm text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
                <h2 className="text-lg font-bold text-foreground">About This Service</h2>
              </div>

              <div className="text-sm text-muted-foreground leading-relaxed space-y-2.5">
                {descLines.map((line: string, i: number) => {
                  const isBullet = /^[-*•]\s/.test(line);
                  const isNum = /^\d+\.\s/.test(line);

                  if (isBullet) return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-[10px] font-bold">✓</span>
                      </span>
                      <span className="text-foreground/80">{renderInline(line.replace(/^[-*•]\s/, ""))}</span>
                    </div>
                  );
                  if (isNum) {
                    const num = line.match(/^\d+/)?.[0];
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-5 h-5 bg-secondary/10 text-secondary rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          {num}
                        </span>
                        <span className="text-foreground/80">{renderInline(line.replace(/^\d+\.\s*/, ""))}</span>
                      </div>
                    );
                  }
                  return <p key={i} className="text-foreground/80">{renderInline(line)}</p>;
                })}
                {descLines.length === 0 && <p className="text-muted-foreground italic">Description coming soon.</p>}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
                <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {[
                  { q: "What file formats do you deliver?", a: "We deliver in all major embroidery machine formats: .DST, .PES, .JEF, .VIP, .EXP, .HUS, .SEW, and more. Just let us know your machine brand." },
                  { q: "How long does digitizing take?", a: "Standard orders are completed within 24 hours. Complex designs may take up to 48 hours. Rush delivery is available." },
                  { q: "What if I'm not satisfied?", a: "We offer unlimited free revisions until you are 100% satisfied. Your satisfaction is our guarantee." },
                ].map(({ q, a }) => (
                  <div key={q} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <p className="font-semibold text-sm text-foreground mb-1">{q}</p>
                    <p className="text-sm text-muted-foreground">{a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN — Sticky ════════════════════════ */}
          <div className="w-full xl:w-[360px] flex-shrink-0">
            <div className="sticky top-6">
              <GigPackagePanel gig={gig} properties={properties || []} userId={user?.id || null} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
