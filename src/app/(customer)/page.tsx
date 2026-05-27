import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowRight, Scissors, Star, ShieldCheck, Zap,
  Clock, Repeat2, CheckCircle2, Search
} from "lucide-react";

function GigCard({ gig }: { gig: any }) {
  const cfg = gig.package_config;
  const basicPrice = cfg?.basic?.price ?? gig.base_price ?? 0;
  const standardPrice = cfg?.standard?.price ?? null;
  const premiumPrice = cfg?.premium?.price ?? null;

  // Strip markdown for plain description preview
  const plainDesc = (gig.description || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/==(.+?)==/g, "$1")
    .replace(/^[-*•]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .trim();

  return (
    <Link
      href={`/gig/${gig.id}`}
      className="group relative bg-white rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {gig.image_url ? (
          <img
            src={gig.image_url}
            alt={gig.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Scissors className="w-10 h-10 text-primary/40" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* From price badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-primary font-bold text-sm px-3 py-1.5 rounded-xl shadow-md">
          From ${Number(basicPrice).toFixed(2)}
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
          Embroidery
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {gig.title}
        </h3>

        <p className="text-muted-foreground text-xs leading-relaxed flex-1 mb-4 line-clamp-2">
          {plainDesc}
        </p>

        {/* Package pricing pills */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {[
            { label: "Basic", price: basicPrice },
            ...(standardPrice ? [{ label: "Standard", price: standardPrice }] : []),
            ...(premiumPrice ? [{ label: "Premium", price: premiumPrice }] : []),
          ].map((pkg) => (
            <span
              key={pkg.label}
              className="text-[10px] font-semibold px-2 py-1 bg-accent/50 text-muted-foreground rounded-lg border border-border"
            >
              {pkg.label} · ${Number(pkg.price).toFixed(2)}
            </span>
          ))}
        </div>

        {/* Trust row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Fast delivery</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> Unlimited revisions</span>
        </div>

        {/* CTA */}
        <div className="w-full bg-primary/8 text-primary border border-primary/20 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all text-sm">
          View Details <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: gigs } = await supabase
    .from("gigs")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const gigList = gigs || [];

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════════════
           SECTION 1: HERO — Services immediately visible
         ══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-900 via-primary/90 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-10">

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Professional Embroidery Digitizing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Turn Your Artwork Into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-secondary ml-2">
                Perfect Stitches
              </span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
              Expert digitizing for embroidery machines. DST, PES, JEF and all major formats.
              Fast delivery · Unlimited revisions · 100% satisfaction.
            </p>
          </div>

          {/* Quick stats bar */}
          <div className="flex justify-center gap-6 md:gap-12 mb-10">
            {[
              { value: "500+", label: "Happy Clients" },
              { value: "24h", label: "Avg. Delivery" },
              { value: "All", label: "Machine Formats" },
              { value: "∞", label: "Free Revisions" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-white/60 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
           SECTION 2: SERVICES GRID — First thing after hero
         ══════════════════════════════════════════════════════ */}
      <div id="services" className="bg-slate-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Our Digitizing Services</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {gigList.length > 0 ? `${gigList.length} service${gigList.length !== 1 ? "s" : ""} available` : "Professional embroidery digitizing services"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white border border-border px-4 py-2.5 rounded-xl">
              <Search className="w-3.5 h-3.5" />
              <span>All services include unlimited revisions</span>
            </div>
          </div>

          {/* Gig grid */}
          {gigList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigList.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-border">
              <Scissors className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Services coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
           SECTION 3: HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three simple steps to get production-ready embroidery files</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: ArrowRight, title: "Choose a Service", desc: "Browse our services and pick the package that fits your project size and complexity." },
              { step: "02", icon: Scissors, title: "Upload Your Artwork", desc: "Upload any image format — PNG, JPG, PDF, or AI. Our team handles the rest." },
              { step: "03", icon: CheckCircle2, title: "Receive Your Files", desc: "Get production-ready embroidery files in your required format within 24 hours." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative p-7 rounded-2xl border border-border bg-white hover:border-primary/30 hover:shadow-lg transition-all group">
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md group-hover:scale-110 transition-transform">
                  {step}
                </div>
                <div className="w-12 h-12 bg-primary/8 rounded-xl flex items-center justify-center mb-4 mt-2">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
           SECTION 4: WHY CHOOSE US
         ══════════════════════════════════════════════════════ */}
      <div className="py-20 bg-gradient-to-br from-slate-900 via-primary/90 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why StitchMarket?</h2>
            <p className="text-white/70 max-w-xl mx-auto">We're not a platform — we're a dedicated digitizing studio serving businesses worldwide.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Scissors, title: "Expert Digitizers", desc: "Every file is hand-crafted by experienced professionals — not automated software." },
              { icon: Zap, title: "Fast Turnaround", desc: "Standard delivery in 24 hours. Complex designs within 48 hours." },
              { icon: ShieldCheck, title: "All Formats", desc: ".DST .PES .JEF .VIP .EXP .HUS .SEW and all other machine formats." },
              { icon: Repeat2, title: "Free Revisions", desc: "Unlimited free revisions until you're 100% happy with the result." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/8 border border-white/15 rounded-2xl p-6 hover:bg-white/12 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="#services"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-2xl hover:bg-amber-50 transition-colors shadow-lg text-base"
            >
              View All Services <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
           SECTION 5: TRUST FOOTER STRIP
         ══════════════════════════════════════════════════════ */}
      <div className="py-10 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {[
              "✓ 100% Satisfaction Guarantee",
              "✓ Unlimited Free Revisions",
              "✓ All Machine Formats Included",
              "✓ Fast 24-Hour Delivery",
              "✓ Professional Quality",
            ].map((item) => (
              <span key={item} className="font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}