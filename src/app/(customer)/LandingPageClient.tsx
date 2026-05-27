"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Scissors, Clock, Repeat2, CheckCircle2,
  BadgeCheck, Shield, Zap, Users, Award, Star,
  LayoutGrid, Sparkles, Package, ChevronLeft, ChevronRight
} from "lucide-react";

// ── Inline markdown renderer ────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)|==([^=]+?)==/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    if (m[1]) parts.push(<strong key={k++} style={{ fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={k++} style={{ fontStyle: "italic" }}>{m[4]}</em>);
    else if (m[5]) parts.push(<mark key={k++} style={{ background: "rgba(34,197,94,0.15)", color: "hsl(var(--secondary))", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{m[5]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts;
}

// ── GigCard for All Services grid ──────────────────────────
function GigCard({ gig }: { gig: any }) {
  const cfg = gig.package_config;
  const basicPrice = cfg?.basic?.price ?? gig.base_price ?? 0;
  const standardPrice = cfg?.standard?.price ?? null;
  const premiumPrice = cfg?.premium?.price ?? null;
  const plainDesc = (gig.description || "")
    .replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
    .replace(/==(.+?)==/g, "$1").replace(/^[-*•]\s/gm, "")
    .replace(/^\d+\.\s/gm, "").trim();

  return (
    <Link
      href={`/gig/${gig.id}`}
      className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative bg-white border-b border-border" style={{ aspectRatio: "4/3" }}>
        {gig.image_url ? (
          <img src={gig.image_url} alt={gig.title} className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/20">
            <Scissors className="w-10 h-10 text-primary/30" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur text-primary font-bold text-sm px-3 py-1.5 rounded-xl shadow-md">
          From ${Number(basicPrice).toFixed(2)}
        </div>
        <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
          Embroidery
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{gig.title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed flex-1 mb-4 line-clamp-2">{plainDesc}</p>
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {[{ label: "Basic", price: basicPrice }, ...(standardPrice ? [{ label: "Standard", price: standardPrice }] : []), ...(premiumPrice ? [{ label: "Premium", price: premiumPrice }] : [])].map(pkg => (
            <span key={pkg.label} className="text-[10px] font-semibold px-2 py-1 bg-accent/50 text-muted-foreground rounded-lg border border-border">
              {pkg.label} · ${Number(pkg.price).toFixed(2)}
            </span>
          ))}
        </div>
        <div className="w-full bg-primary/8 text-primary border border-primary/20 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all text-sm">
          View Service <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

// ── Featured Gig — full detail inline ──────────────────────
function FeaturedGig({ gig, otherCount, portfolioImages }: { gig: any; otherCount: number; portfolioImages: any[] }) {
  const [currentImg, setCurrentImg] = useState(0);
  const allImages = [...(gig.image_url ? [gig.image_url] : []), ...(gig.extraImages || [])];
  
  const cfg = gig.package_config;
  const packages = [
    {
      id: "basic", label: "Basic", emoji: "⚡",
      price: cfg?.basic?.price ?? gig.base_price ?? 0,
      delivery: cfg?.basic?.delivery ? `${cfg.basic.delivery} day${cfg.basic.delivery > 1 ? "s" : ""}` : "1 day",
      features: cfg?.basic?.features ?? ["Up to 5,000 stitches", ".DST .PES .JEF formats", "1 revision round"],
      badge: "", accent: { ring: "border-primary", btn: "bg-primary", badge: "bg-slate-700", check: "text-primary" },
    },
    {
      id: "standard", label: "Standard", emoji: "🏆",
      price: cfg?.standard?.price ?? Math.round((cfg?.basic?.price ?? gig.base_price ?? 5) * 2.5 * 100) / 100,
      delivery: cfg?.standard?.delivery ? `${cfg.standard.delivery} day${cfg.standard.delivery > 1 ? "s" : ""}` : "2 days",
      features: cfg?.standard?.features ?? ["Up to 15,000 stitches", "All major formats", "2 revision rounds", "Run sheet included"],
      badge: "Most Popular", accent: { ring: "border-secondary", btn: "bg-secondary", badge: "bg-secondary", check: "text-secondary" },
    },
    {
      id: "premium", label: "Premium", emoji: "✨",
      price: cfg?.premium?.price ?? Math.round((cfg?.basic?.price ?? gig.base_price ?? 5) * 5 * 100) / 100,
      delivery: cfg?.premium?.delivery ? `${cfg.premium.delivery} day${cfg.premium.delivery > 1 ? "s" : ""}` : "3 days",
      features: cfg?.premium?.features ?? ["Unlimited stitches", "All formats + 3D puff", "Unlimited revisions", "Priority support"],
      badge: "Best Value", accent: { ring: "border-amber-500", btn: "bg-amber-500", badge: "bg-amber-500", check: "text-amber-600" },
    },
  ];

  const descLines = (gig.description || "").split("\n").filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

      {/* ── Hero: Image + Title ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* Image */}
        <div className="lg:col-span-3">
          <div className="relative rounded-2xl overflow-hidden bg-white border border-border shadow-sm group/main" style={{ aspectRatio: "4/3" }}>
            {allImages.length > 0 ? (
              <div className="relative w-full h-full group/slider">
                <img src={allImages[currentImg]} alt={gig.title} className="w-full h-full object-contain group-hover/main:scale-[1.02] transition-transform duration-700" />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); setCurrentImg((c) => (c === 0 ? allImages.length - 1 : c - 1)); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/70 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all z-20 shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5 pr-0.5" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setCurrentImg((c) => (c === allImages.length - 1 ? 0 : c + 1)); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/70 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all z-20 shadow-md"
                    >
                      <ChevronRight className="w-5 h-5 pl-0.5" />
                    </button>
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                      {allImages.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImg ? "bg-white scale-110" : "bg-white/50"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Scissors className="w-16 h-16 text-primary/30" />
              </div>
            )}
            {/* Subtle bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent h-20" />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur text-primary font-bold text-sm px-3 py-1.5 rounded-xl shadow">
              From ${Number(packages[0].price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Title + Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Featured Embroidery Service
            </span>
            <h2 className="text-2xl font-bold text-foreground leading-snug">{gig.title}</h2>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
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

          {/* Short desc */}
          {(gig.package_config?.landingPageDesc || descLines[0]) && (
            <div className="bg-white rounded-xl border border-primary/20 shadow-sm p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                About Our Service
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-line">
                {gig.package_config?.landingPageDesc || renderInline(descLines[0])}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => document.getElementById('pricing-packages')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
            >
              Order This Service <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/inbox"
              className="w-full flex items-center justify-center gap-2 bg-white text-foreground border-2 border-border py-2.5 rounded-xl font-semibold text-sm hover:border-primary/40 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* ── Package Cards ── */}
      <div id="pricing-packages" className="scroll-mt-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            ✦ Pricing Packages
          </div>
          <h3 className="text-2xl font-bold text-foreground">Choose Your Package</h3>
          <p className="text-muted-foreground text-sm mt-2">All packages include unlimited revisions until you're satisfied</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((p) => (
            <div key={p.id} className="relative flex flex-col rounded-2xl border-2 overflow-hidden bg-white border-border hover:border-slate-300 hover:shadow-md transition-all duration-200">
              {/* Badge bar */}
              {p.badge ? (
                <div className={`${p.accent.badge} text-white text-xs font-bold uppercase tracking-widest text-center py-2`}>{p.badge}</div>
              ) : <div className="h-[34px] bg-slate-50 border-b border-border" />}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">{p.emoji}</div>
                  <p className="font-bold text-lg text-foreground">{p.label}</p>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-black text-foreground">${Number(p.price).toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                  <Clock className="w-4 h-4" /><span>{p.delivery} delivery</span>
                </div>

                <Link
                  href={`/gig/${gig.id}`}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all mb-5 text-center block ${p.accent.btn} text-white hover:opacity-90`}
                >
                  Get {p.label}
                </Link>

                <div className="border-t border-border mb-5" />

                <ul className="space-y-2.5 flex-1">
                  {p.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.accent.check}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <Repeat2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.accent.check}`} />
                    <span>Unlimited revisions</span>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Portfolio ── */}
      {portfolioImages && portfolioImages.length > 0 && (
        <div id="portfolio" className="scroll-mt-24 pt-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
              ✦ Our Work
            </div>
            <h3 className="text-2xl font-bold text-foreground">Recent Digitizing Portfolio</h3>
            <p className="text-muted-foreground text-sm mt-2">Explore some of our recently digitized embroidery designs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {portfolioImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-border shadow-sm group cursor-pointer bg-white">
                <img src={img.image_url} alt={img.title || "Portfolio Work"} className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                  <p className="text-white font-bold text-sm translate-y-2 group-hover:translate-y-0 transition-transform">{img.title || "Embroidery Work"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
            <BadgeCheck className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-5 max-w-3xl">
          {[
            { q: "What file formats do you deliver?", a: "We deliver in all major embroidery formats: .DST, .PES, .JEF, .VIP, .EXP, .HUS, .SEW and more. Just let us know your machine brand." },
            { q: "How long does digitizing take?", a: "Standard orders are completed within 24 hours. Complex designs may take up to 48 hours. Rush delivery is available on request." },
            { q: "What if I'm not happy with the result?", a: "We offer unlimited free revisions on every order until you are 100% satisfied — no questions asked." },
            { q: "What image quality do you need?", a: "Best results come from high-resolution files (PNG, JPG, PDF, AI, EPS). We can work with most file types." },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-border last:border-0 pb-5 last:pb-0">
              <p className="font-semibold text-sm text-foreground mb-1.5">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── More services teaser ── */}
      {otherCount > 0 && (
        <div className="bg-gradient-to-r from-primary/8 to-secondary/8 border border-border rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-foreground text-lg">{otherCount} More Service{otherCount > 1 ? "s" : ""} Available</p>
            <p className="text-sm text-muted-foreground mt-0.5">Browse all our digitizing services to find the perfect fit.</p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("all-services-tab");
              if (el) el.click();
            }}
            className="flex-shrink-0 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <LayoutGrid className="w-4 h-4" /> View All
          </button>
        </div>
      )}
    </div>
  );
}

// ── All Services Grid ───────────────────────────────────────
function AllServicesGrid({ gigs }: { gigs: any[] }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Digitizing Services</h2>
          <p className="text-muted-foreground text-sm mt-1">{gigs.length} service{gigs.length !== 1 ? "s" : ""} available</p>
        </div>
      </div>
      {gigs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Services coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => <GigCard key={gig.id} gig={gig} />)}
        </div>
      )}
    </div>
  );
}

// ── Main Landing Page Client ────────────────────────────────
export default function LandingPageClient({
  featuredGig,
  allGigs,
  portfolioImages,
}: {
  featuredGig: any | null;
  allGigs: any[];
  portfolioImages: any[];
}) {
  const [activeTab, setActiveTab] = useState<"featured" | "all">("featured");

  const tabs = [
    { id: "featured", label: "Featured Embroidery Service", icon: Sparkles },
    { id: "all", label: `All Services (${allGigs.length})`, icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-br from-slate-900 via-primary/85 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Professional Embroidery Digitizing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Turn Your Artwork Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-secondary ml-2">
              Perfect Stitches
            </span>
          </h1>
          <p className="text-white/70 text-base max-w-xl mx-auto mb-8">
            Expert digitizing for embroidery machines. DST, PES, JEF and all major formats. Fast delivery · Unlimited revisions.
          </p>
          <div className="flex justify-center gap-8 md:gap-16">
            {[{ value: "500+", label: "Happy Clients" }, { value: "24h", label: "Avg. Delivery" }, { value: "All", label: "Machine Formats" }, { value: "∞", label: "Free Revisions" }].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-white/60 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar — sits at the bottom of the hero ── */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={id === "all" ? "all-services-tab" : undefined}
                onClick={() => setActiveTab(id as "featured" | "all")}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === id
                    ? "border-amber-400 text-white"
                    : "border-transparent text-white/50 hover:text-white/80 hover:border-white/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      {activeTab === "featured" ? (
        featuredGig ? (
          <FeaturedGig gig={featuredGig} otherCount={allGigs.length - 1} portfolioImages={portfolioImages} />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-20 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">No featured service yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon or browse all services.</p>
          </div>
        )
      ) : (
        <AllServicesGrid gigs={allGigs} />
      )}

      {/* ── Trust footer strip ── */}
      <div className="py-10 bg-white border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
            {["✓ 100% Satisfaction Guarantee", "✓ Unlimited Free Revisions", "✓ All Machine Formats", "✓ Fast 24-Hour Delivery", "✓ Professional Quality"].map(item => (
              <span key={item} className="font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
