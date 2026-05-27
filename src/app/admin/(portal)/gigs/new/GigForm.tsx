"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import {
  Loader2, Bold, Italic, Highlighter,
  List, ListOrdered, X, ImagePlus, Eye, EyeOff,
  DollarSign, Tag, AlignLeft
} from "lucide-react";

// ── Rich Text Toolbar
function RichToolbar({ onFormat }: { onFormat: (tag: string) => void }) {
  const tools = [
    { icon: Bold, label: "Bold — wraps selection in **text**", tag: "bold" },
    { icon: Italic, label: "Italic — wraps selection in *text*", tag: "italic" },
    { icon: Highlighter, label: "Highlight — wraps in ==text==", tag: "highlight" },
    { icon: List, label: "Bullet list", tag: "bullet" },
    { icon: ListOrdered, label: "Numbered list", tag: "number" },
  ];
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border border-border rounded-t-lg border-b-0 flex-wrap">
      {tools.map(({ icon: Icon, label, tag }) => (
        <button
          key={tag}
          type="button"
          title={label}
          onMouseDown={(e) => { e.preventDefault(); onFormat(tag); }}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
      <span className="text-[11px] text-slate-400 ml-2 hidden md:inline">
        **bold** &nbsp;*italic*&nbsp; ==highlight== &nbsp;- bullet &nbsp;1. list
      </span>
    </div>
  );
}

// ── Inline renderer (shared)
function renderLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|==(.+?)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    if (m[1]) parts.push(<strong key={key++} className="font-bold">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key++}>{m[4]}</em>);
    else if (m[5]) parts.push(<mark key={key++} className="bg-yellow-200 px-0.5 rounded not-italic">{m[5]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function DescriptionPreview({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (/^[-*•]\s/.test(line)) return (
          <div key={i} className="flex gap-2">
            <span className="text-primary font-bold flex-shrink-0">✓</span>
            <span>{renderLine(line.replace(/^[-*•]\s/, ""))}</span>
          </div>
        );
        if (/^\d+\.\s/.test(line)) return (
          <div key={i} className="flex gap-2">
            <span className="text-primary font-semibold min-w-[20px] flex-shrink-0">{line.match(/^\d+/)?.[0]}.</span>
            <span>{renderLine(line.replace(/^\d+\.\s*/, ""))}</span>
          </div>
        );
        return <p key={i}>{renderLine(line)}</p>;
      })}
    </div>
  );
}

// ── Main Form
export default function GigForm({ gigId, defaultValues }: {
  gigId?: string;
  defaultValues?: { title: string; description: string; basePrice: string; images: string[] };
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [basePrice, setBasePrice] = useState(defaultValues?.basePrice ?? "");
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(gigId);

  // Format helpers
  const applyFormat = useCallback((tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = description.slice(s, e);
    const before = description.slice(0, s);
    const after = description.slice(e);
    let rep = sel;
    if (tag === "bold") rep = `**${sel || "bold text"}**`;
    else if (tag === "italic") rep = `*${sel || "italic text"}*`;
    else if (tag === "highlight") rep = `==${sel || "highlighted"}==`;
    else if (tag === "bullet") rep = (sel || "Item").split("\n").map(l => `- ${l}`).join("\n");
    else if (tag === "number") rep = (sel || "Item").split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n");
    const newDesc = before + rep + after;
    setDescription(newDesc);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s, s + rep.length); }, 0);
  }, [description]);

  // Image helpers
  const addImage = (url: string) => setImages(p => [...p, url]);
  const removeImage = (idx: number) => setImages(p => p.filter((_, i) => i !== idx));

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!title.trim()) { setErrorMsg("Title is required."); return; }
    if (!description.trim()) { setErrorMsg("Description is required."); return; }
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      setErrorMsg("Please enter a valid price greater than 0."); return;
    }
    if (images.length === 0) { setErrorMsg("Please upload at least one image."); return; }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      base_price: parseFloat(basePrice),
      image_url: images[0],
    };

    let savedId = gigId;

    if (isEdit && gigId) {
      const { error } = await supabase.from("gigs").update(payload).eq("id", gigId);
      if (error) {
        setErrorMsg("Save failed: " + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("gigs")
        .insert([{ ...payload, is_active: true }])
        .select("id")
        .single();
      if (error) { setErrorMsg("Create failed: " + error.message); setLoading(false); return; }
      savedId = data.id;
    }

    // Extra images
    try {
      await supabase.from("gig_images").delete().eq("gig_id", savedId);
      if (images.length > 1) {
        await supabase.from("gig_images").insert(
          images.slice(1).map((url, idx) => ({ gig_id: savedId, image_url: url, sort_order: idx + 1 }))
        );
      }
    } catch (_) {}

    setSuccessMsg(isEdit ? "Gig updated successfully!" : "Gig created!");
    setLoading(false);
    setTimeout(() => {
      router.push("/admin/gigs");
      router.refresh();
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      {/* ── Title */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <Tag className="w-4 h-4 text-primary" /> Gig Title
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          placeholder="e.g. I will do embroidery digitizing into DST, PES, JEF in 1 hour"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/120</p>
      </div>

      {/* ── Base Price */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <DollarSign className="w-4 h-4 text-primary" /> Base Price — Basic Package
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-semibold"
            placeholder="5.00"
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>Basic = <strong className="text-foreground">${parseFloat(basePrice || "0").toFixed(2)}</strong></span>
          <span>Standard = <strong className="text-foreground">${(parseFloat(basePrice || "0") * 2.5).toFixed(2)}</strong></span>
          <span>Premium = <strong className="text-foreground">${(parseFloat(basePrice || "0") * 5).toFixed(2)}</strong></span>
        </div>
      </div>

      {/* ── Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlignLeft className="w-4 h-4 text-primary" /> Description
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>
        <RichToolbar onFormat={applyFormat} />
        <textarea
          ref={textareaRef}
          required
          rows={12}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-y rounded-b-lg font-mono text-sm"
          placeholder={`Welcome to my gig!\n\nI am an embroidery digitizing Expert...\n\n- **High quality** work\n- ==100% satisfaction guaranteed==\n- Quick response\n\n1. Upload your image\n2. I digitize in 24 hours\n3. You receive all machine formats`}
        />
        {showPreview && description && (
          <div className="mt-3 p-5 bg-white border border-border rounded-xl shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
            <DescriptionPreview text={description} />
          </div>
        )}
      </div>

      {/* ── Multiple Images */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
          <ImagePlus className="w-4 h-4 text-primary" /> Gig Images
          <span className="text-xs font-normal text-muted-foreground">(up to 5 — first = primary thumbnail)</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
          {images.map((url, idx) => (
            <div key={url + idx}
              className={`relative rounded-xl overflow-hidden aspect-square border-2 ${idx === 0 ? "border-primary shadow-md" : "border-border"}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] font-bold text-center py-0.5">
                  PRIMARY
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              onSuccess={(result: any) => addImage(result.info.secure_url)}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs font-medium">Add Image</span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>
        {images.length === 0 && (
          <p className="text-xs text-red-500 mt-2">⚠ At least one image is required</p>
        )}
      </div>

      {/* ── Actions */}
      <div className="pt-6 border-t border-border flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.push("/admin/gigs")}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/50 transition-colors border border-border"
        >
          ← Cancel
        </button>
        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="bg-primary text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : (isEdit ? "Save Changes" : "Create Gig")}
        </button>
      </div>
    </form>
  );
}
