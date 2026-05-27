"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const FALLBACK = "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80&w=800";

export default function GigGallery({ images, title }: { images: string[]; title: string }) {
  const allImages = images.length > 0 ? images : [FALLBACK];
  const [active, setActive] = useState(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const prev = () => setActive(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActive(i => (i + 1) % allImages.length);

  return (
    <>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      {/* ── Unique showcase frame ─────────────────────────── */}
      <div className="relative select-none">

        {/* Decorative background plate — offset shadow card */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20"
          style={{ transform: "translate(6px, 6px)" }}
        />

        {/* Main image container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group"
          style={{ aspectRatio: "4/3" }}
          onClick={() => setPreviewSrc(allImages[active])}
        >
          <img
            src={allImages[active]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Fullscreen hint */}
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity border border-white/30">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-medium">View Full</span>
          </div>

          {/* Brand watermark bottom-left */}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[8px] font-bold">
              SM
            </div>
            <span className="text-white text-xs font-semibold tracking-wide">StitchMarket</span>
          </div>

          {/* Image counter badge */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20">
              {active + 1} / {allImages.length}
            </div>
          )}

          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-lg rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-lg rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Thumbnail strip — horizontal scrollable ──────── */}
      {allImages.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((url, idx) => (
            <button
              key={url + idx}
              onClick={() => setActive(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                active === idx
                  ? "border-primary shadow-md scale-105"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-border"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {active === idx && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Dot indicators for mobile ────────────────────── */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {allImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`transition-all duration-200 rounded-full ${
                active === idx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
