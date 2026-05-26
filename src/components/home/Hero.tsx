"use client";

import { Search } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-primary py-20 lg:py-32">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80" 
          alt="Embroidery background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight font-outfit">
            Find the perfect <span className="text-secondary italic">embroidery services</span> for your business
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
            Connect with top-tier embroidery digitizers and designers. Premium quality, fast turnaround, and guaranteed satisfaction.
          </p>
          
          <div className="bg-white rounded-full p-2 flex items-center max-w-2xl shadow-xl">
            <div className="pl-4 pr-2 flex items-center text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <input 
              type="text" 
              placeholder="Try '3D Puff Embroidery' or 'Logo Digitizing'" 
              className="flex-1 h-12 outline-none text-foreground text-lg bg-transparent"
            />
            <button className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors">
              Search
            </button>
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-sm font-medium text-white/70">
            <span>Popular:</span>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 border border-white/20 rounded-full cursor-pointer hover:bg-white/10 transition">Logo Digitizing</span>
              <span className="px-3 py-1 border border-white/20 rounded-full cursor-pointer hover:bg-white/10 transition">Cap Embroidery</span>
              <span className="px-3 py-1 border border-white/20 rounded-full cursor-pointer hover:bg-white/10 transition">Patches</span>
              <span className="px-3 py-1 border border-white/20 rounded-full cursor-pointer hover:bg-white/10 transition">DST/PES Files</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
