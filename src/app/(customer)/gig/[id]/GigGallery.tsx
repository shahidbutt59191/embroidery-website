"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

const FALLBACK = "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80&w=800";

export default function GigGallery({ images, title }: { images: string[]; title: string }) {
  const allImages = images.length > 0 ? images : [FALLBACK];
  const [active, setActive] = useState(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const prev = () => setActive((i) => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActive((i) => (i + 1) % allImages.length);

  return (
    <>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      {/* Main image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group cursor-zoom-in select-none"
        style={{ aspectRatio: "16/9" }}
        onClick={() => setPreviewSrc(allImages[active])}
      >
        <img
          src={allImages[active]}
          alt={title}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        {/* Arrow buttons — only show if multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {active + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {allImages.map((url, idx) => (
            <button
              key={url + idx}
              onClick={() => setActive(idx)}
              className={`w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${
                active === idx ? "border-gray-900 opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
