"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, Download } from "lucide-react";

interface ImagePreviewModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls */}
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <img
          src={src}
          alt={alt || "Preview"}
          className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
        />
        {alt && (
          <p className="text-white/60 text-xs text-center mt-3">{alt}</p>
        )}
      </div>
    </div>
  );
}
