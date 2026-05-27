"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

export default function GigGallery({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // In a full implementation you'd have multiple images
  // For now we show the single main image with a placeholder second
  const mainImage = imageUrl || "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80&w=800";

  return (
    <>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      {/* Main image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group cursor-zoom-in"
        style={{ aspectRatio: "16/9" }}
        onClick={() => setPreviewSrc(mainImage)}
      >
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Zoom hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setPreviewSrc(mainImage)}
          className="w-16 h-16 rounded border-2 border-primary overflow-hidden flex-shrink-0"
        >
          <img src={mainImage} alt="thumb" className="w-full h-full object-cover" />
        </button>
        {/* Placeholder thumbnails */}
        {[1, 2].map((i) => (
          <div key={i} className="w-16 h-16 rounded border-2 border-transparent overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-400">+{i}</span>
          </div>
        ))}
      </div>
    </>
  );
}
