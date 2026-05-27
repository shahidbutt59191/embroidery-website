import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock, Repeat2, Shield, Zap, Users, Award } from "lucide-react";
import GigPackagePanel from "./GigPackagePanel";
import GigGallery from "./GigGallery";
import AskQuestionButton from "./AskQuestionButton";

// Inline markdown renderer (server-safe, no hooks)
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|==(.+?)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} className="font-bold text-foreground">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={k++}>{m[4]}</em>);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">

      {/* ── Breadcrumb band */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary/80 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/#services" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Services
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-sm text-white/90 truncate max-w-xs">{gig.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ══ SECTION 1: Hero — Gallery + Title ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Gallery — 3/5 width */}
          <div className="lg:col-span-3">
            <GigGallery images={allImages} title={gig.title} />
          </div>

          {/* Title + badges + quick stats */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-snug">
                {gig.title}
              </h1>

              {/* Service badge pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { icon: Shield, label: "Professional Service", color: "bg-primary/10 text-primary" },
                  { icon: Zap, label: "Fast Turnaround", color: "bg-amber-50 text-amber-700 border border-amber-100" },
                  { icon: Repeat2, label: "Unlimited Revisions", color: "bg-green-50 text-green-700 border border-green-100" },
                  { icon: BadgeCheck, label: "Quality Guaranteed", color: "bg-secondary/10 text-secondary" },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${color}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Award, value: "5★", label: "Quality" },
                { icon: Users, value: "500+", label: "Clients" },
                { icon: Clock, value: "24h", label: "Avg. Delivery" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-3 text-center shadow-sm">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="font-bold text-base text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Short intro */}
            {descLines.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {renderInline(descLines[0])}
                </p>
              </div>
            )}

            {/* Chat button — client component */}
            <AskQuestionButton />
          </div>
        </div>

        {/* ══ SECTION 2: Package Cards — Full Width ══ */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
              ✦ Our Packages
            </div>
            <h2 className="text-2xl font-bold text-foreground">Choose the Right Package for You</h2>
            <p className="text-muted-foreground text-sm mt-2">
              All packages include unlimited revisions until you're satisfied
            </p>
          </div>

          <GigPackagePanel gig={gig} properties={properties || []} userId={user?.id || null} />
        </div>

        {/* ══ SECTION 3: About This Service ══ */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">About This Service</h2>
              <p className="text-xs text-muted-foreground">What you get with every order</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-3xl">
            {descLines.map((line: string, i: number) => {
              const isBullet = /^[-*•]\s/.test(line);
              const isNum = /^\d+\.\s/.test(line);
              if (isBullet) return (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-[10px] font-bold">✓</span>
                  </span>
                  <span className="text-foreground/80">{renderInline(line.replace(/^[-*•]\s/, ""))}</span>
                </div>
              );
              if (isNum) {
                const num = line.match(/^\d+/)?.[0];
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 bg-secondary/10 text-secondary rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{num}</span>
                    <span className="text-foreground/80">{renderInline(line.replace(/^\d+\.\s*/, ""))}</span>
                  </div>
                );
              }
              return <p key={i} className="text-foreground/80">{renderInline(line)}</p>;
            })}
            {descLines.length === 0 && <p className="italic">Description coming soon.</p>}
          </div>
        </div>

        {/* ══ SECTION 4: FAQ ══ */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
              <p className="text-xs text-muted-foreground">Everything you need to know</p>
            </div>
          </div>
          <div className="space-y-5 max-w-3xl">
            {[
              { q: "What file formats do you deliver?", a: "We deliver in all major embroidery formats: .DST, .PES, .JEF, .VIP, .EXP, .HUS, .SEW and more. Just let us know your machine brand and we'll provide the right format." },
              { q: "How long does digitizing take?", a: "Standard orders are completed within 24 hours. Complex designs may take up to 48 hours. Rush delivery is available on request." },
              { q: "What if I'm not happy with the result?", a: "We offer unlimited free revisions on every order until you are 100% satisfied — no questions asked." },
              { q: "What image quality do you need?", a: "Best results come from high-resolution files (PNG, JPG, PDF, AI, EPS). We can work with most file types, but higher resolution = better output." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border last:border-0 pb-5 last:pb-0">
                <p className="font-semibold text-sm text-foreground mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
