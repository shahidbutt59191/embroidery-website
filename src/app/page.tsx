import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Scissors, Star, ShieldCheck, Zap } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: gigs, error } = await supabase.from('gigs').select('*').eq('is_active', true);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-accent/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10 pt-24 pb-32 flex flex-col items-center text-center">
          <span className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold text-primary border border-border/50 shadow-sm mb-6 inline-flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Premium Digitizing Services
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground font-outfit tracking-tight mb-6 leading-tight">
            Bring Your Designs to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Life</span> with Perfect Stitches
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
            Professional embroidery digitizing for left chest, caps, jackets, and more. Upload your artwork, customize your requirements, and get production-ready files fast.
          </p>
          <div className="flex gap-4">
            <a href="#services" className="bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2">
              Explore Services <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-accent/5 border border-border hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Expert Digitizing</h3>
              <p className="text-muted-foreground">Every design is manually digitized by experts to ensure flawless sewing on any machine.</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/5 border border-border hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Fast Turnaround</h3>
              <p className="text-muted-foreground">We deliver your digitized files quickly without compromising on quality or precision.</p>
            </div>
            <div className="p-6 rounded-2xl bg-accent/5 border border-border hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2">Pay After Satisfaction</h3>
              <p className="text-muted-foreground">Approve the digitized file before your wallet is charged. 100% satisfaction guaranteed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid (Replaces Marketplace) */}
      <div id="services" className="py-24 bg-accent/20 border-t border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground font-outfit mb-4">Our Digitizing Services</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Select a service below to configure your order. We handle everything from simple logos to complex 3D puff designs.</p>
          </div>

          {error && <div className="text-red-500 text-center">Failed to load services.</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gigs?.map((gig) => (
              <Link key={gig.id} href={`/gig/${gig.id}`} className="group bg-white rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                <div className="relative h-56 overflow-hidden bg-accent">
                  <img 
                    src={gig.image_url} 
                    alt={gig.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm">
                    From ${gig.base_price}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold font-outfit text-foreground mb-2 group-hover:text-primary transition-colors">{gig.title}</h3>
                  <p className="text-muted-foreground text-sm flex-1 line-clamp-3 mb-4">{gig.description}</p>
                  
                  <div className="w-full bg-accent/50 text-primary font-semibold py-3 rounded-xl flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    Order Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
            {gigs?.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No services available at the moment. Please check back later.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}