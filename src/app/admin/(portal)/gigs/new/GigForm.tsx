"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import {
  UploadCloud, Loader2, Bold, Italic, Highlighter,
  List, ListOrdered, X, GripVertical, ImagePlus
} from "lucide-react";

// ── Rich Text Toolbar ───────────────────────────────────────
function RichToolbar({ onFormat }: { onFormat: (tag: string) => void }) {
  const tools = [
    { icon: Bold, label: "Bold", tag: "bold" },
    { icon: Italic, label: "Italic", tag: "italic" },
    { icon: Highlighter, label: "Highlight", tag: "highlight" },
    { icon: List, label: "Bullet List", tag: "bullet" },
    { icon: ListOrdered, label: "Numbered List", tag: "number" },
  ];
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border border-border rounded-t-xl border-b-0">
      {tools.map(({ icon: Icon, label, tag }) => (
        <button
          key={tag}
          type="button"
          title={label}
          onMouseDown={(e) => { e.preventDefault(); onFormat(tag); }}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
      <div className="text-xs text-gray-400 ml-3 hidden sm:block">
        Use - or * for bullets, 1. for numbered, **bold**, *italic*, ==highlight==
      </div>
    </div>
  );
}

// ── Main Form ───────────────────────────────────────────────
export default function GigForm({ gigId, defaultValues }: {
  gigId?: string;
  defaultValues?: { title: string; description: string; basePrice: string; images: string[] };
}) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [basePrice, setBasePrice] = useState(defaultValues?.basePrice || "");
  const [images, setImages] = useState<string[]>(defaultValues?.images || []);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(gigId);

  // ── Format helpers ───────────────────────────────────────
  const applyFormat = useCallback((tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = description.slice(start, end);
    const before = description.slice(0, start);
    const after = description.slice(end);

    let replacement = selected;
    if (tag === "bold") replacement = `**${selected}**`;
    else if (tag === "italic") replacement = `*${selected}*`;
    else if (tag === "highlight") replacement = `==${selected}==`;
    else if (tag === "bullet") {
      const lines = (selected || "New item").split("\n");
      replacement = lines.map((l) => `- ${l}`).join("\n");
    } else if (tag === "number") {
      const lines = (selected || "New item").split("\n");
      replacement = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
    }

    const newDesc = before + replacement + after;
    setDescription(newDesc);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start, start + replacement.length);
    }, 0);
  }, [description]);

  // ── Image helpers ────────────────────────────────────────
  const addImage = (url: string) => {
    setImages((prev) => [...prev, url]);
  };
  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { setErrorMsg("Please upload at least one image."); return; }
    setLoading(true);
    setErrorMsg("");

    const payload = {
      title,
      description,
      base_price: parseFloat(basePrice),
      image_url: images[0], // primary image for backward compat
      is_active: true,
    };

    let gigRecord: any;

    if (isEdit) {
      const { data, error } = await supabase.from("gigs").update(payload).eq("id", gigId).select().single();
      if (error) { setErrorMsg(error.message); setLoading(false); return; }
      gigRecord = data;
    } else {
      const { data, error } = await supabase.from("gigs").insert([payload]).select().single();
      if (error) { setErrorMsg(error.message); setLoading(false); return; }
      gigRecord = data;
    }

    // Save additional images (index 1+) to gig_images table if it exists
    try {
      if (images.length > 1) {
        const extraImages = images.slice(1).map((url, idx) => ({
          gig_id: gigRecord.id,
          image_url: url,
          sort_order: idx + 1,
        }));
        // Delete old extra images first
        await supabase.from("gig_images").delete().eq("gig_id", gigRecord.id);
        await supabase.from("gig_images").insert(extraImages);
      }
    } catch (_) {
      // gig_images table may not exist yet — silently ignore
    }

    router.push("/admin/gigs");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Gig Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary"
          placeholder="e.g. I will do embroidery digitizing in 1 hour"
        />
      </div>

      {/* Description — Rich Text */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Description
          <span className="text-xs font-normal text-muted-foreground ml-2">(supports **bold**, *italic*, ==highlight==, - bullets, 1. lists)</span>
        </label>
        <RichToolbar onFormat={applyFormat} />
        <textarea
          ref={textareaRef}
          required
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary transition-colors resize-y rounded-b-xl font-mono text-sm"
          placeholder={`Hy,\nWelcome to my gig!\n\nI am an embroidery digitizing Expert...\n\n- High quality work\n- 100% satisfaction\n- Quick response\n\n1. Upload your image\n2. I digitize in 24 hours\n3. You receive all formats`}
        />
        {/* Live preview */}
        {description && (
          <details className="mt-2">
            <summary className="text-xs text-primary cursor-pointer hover:underline">Preview description</summary>
            <div className="mt-2 p-4 bg-white border border-border rounded-xl text-sm text-gray-700 leading-relaxed space-y-2">
              {description.split("\n").filter(Boolean).map((line, i) => {
                const isBullet = /^[-*•]\s/.test(line);
                const isNum = /^\d+\.\s/.test(line);
                const render = (txt: string) => txt
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.+?)\*/g, "<em>$1</em>")
                  .replace(/==(.+?)==/g, '<mark class="bg-yellow-200 px-0.5">$1</mark>');

                if (isBullet) return (
                  <div key={i} className="flex gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span dangerouslySetInnerHTML={{ __html: render(line.replace(/^[-*•]\s/, "")) }} />
                  </div>
                );
                if (isNum) return (
                  <div key={i} className="flex gap-2">
                    <span className="text-primary font-semibold min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span>
                    <span dangerouslySetInnerHTML={{ __html: render(line.replace(/^\d+\.\s/, "")) }} />
                  </div>
                );
                return <p key={i} dangerouslySetInnerHTML={{ __html: render(line) }} />;
              })}
            </div>
          </details>
        )}
      </div>

      {/* Base Price */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Base Price (Basic Package) ($)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary"
          placeholder="5.00"
        />
        <p className="text-xs text-muted-foreground mt-1">Standard = 2.5× this price. Premium = 5× this price. (auto-calculated on gig page)</p>
      </div>

      {/* Multiple Images */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Gig Images
          <span className="text-xs font-normal text-muted-foreground ml-2">(first image is the primary thumbnail — add up to 5)</span>
        </label>

        {/* Image grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
          {images.map((url, idx) => (
            <div key={url + idx} className={`relative rounded-xl overflow-hidden border-2 aspect-video ${idx === 0 ? "border-primary" : "border-border"}`}>
              <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Primary</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Upload button — only show if under 5 images */}
          {images.length < 5 && (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              onSuccess={(result: any) => addImage(result.info.secure_url)}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors text-muted-foreground hover:text-secondary"
                >
                  <ImagePlus className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Add Image</span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>

        {images.length === 0 && (
          <p className="text-xs text-red-500">⚠ At least one image is required</p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-border flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl font-medium text-foreground hover:bg-accent/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : (isEdit ? "Save Changes" : "Create Gig")}
        </button>
      </div>
    </form>
  );
}
