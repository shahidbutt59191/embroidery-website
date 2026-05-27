"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import {
  Loader2, Bold, Italic, Highlighter, List, ListOrdered,
  X, ImagePlus, Eye, EyeOff, Tag, AlignLeft, Plus, Trash2,
  Zap, Award, Sparkles
} from "lucide-react";

// ── Rich Text Toolbar ─────────────────────────────────────────
function RichToolbar({ onFormat }: { onFormat: (tag: string) => void }) {
  const tools = [
    { icon: Bold, label: "Bold (**text**)", tag: "bold" },
    { icon: Italic, label: "Italic (*text*)", tag: "italic" },
    { icon: Highlighter, label: "Highlight (==text==)", tag: "highlight" },
    { icon: List, label: "Bullet list", tag: "bullet" },
    { icon: ListOrdered, label: "Numbered list", tag: "number" },
  ];
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border border-border rounded-t-lg border-b-0 flex-wrap">
      {tools.map(({ icon: Icon, label, tag }) => (
        <button key={tag} type="button" title={label}
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

// ── Inline renderer ───────────────────────────────────────────
function renderLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|==(.+?)==/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
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
          <div key={i} className="flex gap-2"><span className="text-primary font-bold">✓</span><span>{renderLine(line.replace(/^[-*•]\s/, ""))}</span></div>
        );
        if (/^\d+\.\s/.test(line)) return (
          <div key={i} className="flex gap-2"><span className="text-primary font-semibold min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span><span>{renderLine(line.replace(/^\d+\.\s*/, ""))}</span></div>
        );
        return <p key={i}>{renderLine(line)}</p>;
      })}
    </div>
  );
}

// ── Package editor types ──────────────────────────────────────
type PackageConfig = {
  price: string;
  description: string;
  delivery: string;
  features: string[];
};

const DEFAULT_PACKAGES: Record<string, PackageConfig> = {
  basic:    { price: "", description: "Digitize one simple logo up to 5,000 stitches", delivery: "1", features: ["Up to 5,000 stitches", ".DST .PES .JEF formats", "Unlimited revisions"] },
  standard: { price: "", description: "Medium complexity design up to 15,000 stitches", delivery: "2", features: ["Up to 15,000 stitches", "All major formats", "Run sheet included", "Unlimited revisions"] },
  premium:  { price: "", description: "Complex design, 3D puff, patches — no limits", delivery: "3", features: ["Unlimited stitches", "All formats + 3D puff", "Run sheet + sew-out scan", "Unlimited revisions", "Priority support"] },
};

const PKG_META = [
  { id: "basic",    label: "Basic",    emoji: "⚡", icon: Zap,      color: "border-primary/40 bg-primary/5",    text: "text-primary" },
  { id: "standard", label: "Standard", emoji: "🏆", icon: Award,    color: "border-secondary/40 bg-secondary/5", text: "text-secondary", badge: "Most Popular" },
  { id: "premium",  label: "Premium",  emoji: "✨", icon: Sparkles, color: "border-amber-400/40 bg-amber-50",    text: "text-amber-600", badge: "Best Value" },
];

// ── Package Editor card ───────────────────────────────────────
function PackageEditor({
  meta, config, onChange,
}: {
  meta: (typeof PKG_META)[0];
  config: PackageConfig;
  onChange: (c: PackageConfig) => void;
}) {
  const addFeature = () => onChange({ ...config, features: [...config.features, ""] });
  const updateFeature = (i: number, v: string) => {
    const f = [...config.features]; f[i] = v; onChange({ ...config, features: f });
  };
  const removeFeature = (i: number) => onChange({ ...config, features: config.features.filter((_, idx) => idx !== i) });

  return (
    <div className={`rounded-xl border-2 p-5 space-y-4 ${meta.color}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{meta.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base ${meta.text}`}>{meta.label}</h3>
            {"badge" in meta && meta.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary text-white px-2 py-0.5 rounded-full">{meta.badge}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Set price, description and included features</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Price (USD) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
            <input
              type="number" min="0.01" step="0.01" required
              value={config.price}
              onChange={(e) => onChange({ ...config, price: e.target.value })}
              className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Delivery */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Delivery (days) *</label>
          <select
            value={config.delivery}
            onChange={(e) => onChange({ ...config, delivery: e.target.value })}
            className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {["1","2","3","5","7","10","14"].map(d => (
              <option key={d} value={d}>{d} day{d !== "1" ? "s" : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Short Description *</label>
        <input
          type="text"
          value={config.description}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Describe what the customer gets..."
          maxLength={120}
        />
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-2">Included Features</label>
        <div className="space-y-2">
          {config.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary text-xs font-bold">✓</span>
              <input
                type="text"
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="e.g. Up to 5,000 stitches"
              />
              <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addFeature}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1"
          >
            <Plus className="w-3 h-3" /> Add Feature
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────
export default function GigForm({ gigId, defaultValues }: {
  gigId?: string;
  defaultValues?: {
    title: string;
    description: string;
    basePrice: string;
    images: string[];
    packageConfig?: Record<string, PackageConfig>;
  };
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [images, setImages] = useState<string[]>(defaultValues?.images ?? []);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(gigId);

  // Package state — each package has its own config
  const [packages, setPackages] = useState<Record<string, PackageConfig>>(() => {
    if (defaultValues?.packageConfig) {
      // Merge DB config over defaults
      return {
        basic:    { ...DEFAULT_PACKAGES.basic,    ...defaultValues.packageConfig.basic,    price: defaultValues.packageConfig.basic?.price    || defaultValues.basePrice || "" },
        standard: { ...DEFAULT_PACKAGES.standard, ...defaultValues.packageConfig.standard, price: defaultValues.packageConfig.standard?.price || "" },
        premium:  { ...DEFAULT_PACKAGES.premium,  ...defaultValues.packageConfig.premium,  price: defaultValues.packageConfig.premium?.price  || "" },
      };
    }
    return {
      basic:    { ...DEFAULT_PACKAGES.basic,    price: defaultValues?.basePrice || "" },
      standard: { ...DEFAULT_PACKAGES.standard },
      premium:  { ...DEFAULT_PACKAGES.premium },
    };
  });

  const updatePackage = (id: string, cfg: PackageConfig) =>
    setPackages(p => ({ ...p, [id]: cfg }));

  // Format helpers
  const applyFormat = useCallback((tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = description.slice(s, e);
    const before = description.slice(0, s), after = description.slice(e);
    let rep = sel;
    if (tag === "bold") rep = `**${sel || "bold text"}**`;
    else if (tag === "italic") rep = `*${sel || "italic text"}*`;
    else if (tag === "highlight") rep = `==${sel || "highlighted"}==`;
    else if (tag === "bullet") rep = (sel || "Item").split("\n").map(l => `- ${l}`).join("\n");
    else if (tag === "number") rep = (sel || "Item").split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n");
    setDescription(before + rep + after);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s, s + rep.length); }, 0);
  }, [description]);

  const addImage = (url: string) => setImages(p => [...p, url]);
  const removeImage = (idx: number) => setImages(p => p.filter((_, i) => i !== idx));

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (!title.trim()) { setErrorMsg("Title is required."); return; }
    if (!description.trim()) { setErrorMsg("Description is required."); return; }
    if (!packages.basic.price || parseFloat(packages.basic.price) <= 0) { setErrorMsg("Basic package price is required."); return; }
    if (!packages.standard.price || parseFloat(packages.standard.price) <= 0) { setErrorMsg("Standard package price is required."); return; }
    if (!packages.premium.price || parseFloat(packages.premium.price) <= 0) { setErrorMsg("Premium package price is required."); return; }
    if (images.length === 0) { setErrorMsg("Please upload at least one image."); return; }

    setLoading(true);

    const packageConfig = {
      basic:    { ...packages.basic,    price: parseFloat(packages.basic.price) },
      standard: { ...packages.standard, price: parseFloat(packages.standard.price) },
      premium:  { ...packages.premium,  price: parseFloat(packages.premium.price) },
    };

    const payload = {
      title: title.trim(),
      description: description.trim(),
      base_price: parseFloat(packages.basic.price),
      image_url: images[0],
      package_config: packageConfig,
    };

    let savedId = gigId;

    if (isEdit && gigId) {
      const { error } = await supabase.from("gigs").update(payload).eq("id", gigId);
      if (error) { setErrorMsg("Save failed: " + error.message); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("gigs").insert([{ ...payload, is_active: true }]).select("id").single();
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

    setSuccessMsg(isEdit ? "Gig updated!" : "Gig created!");
    setLoading(false);
    setTimeout(() => { router.push("/admin/gigs"); router.refresh(); }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />{errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-medium">✓ {successMsg}</div>
      )}

      {/* ── Title */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <Tag className="w-4 h-4 text-primary" /> Gig Title
        </label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          placeholder="e.g. I will do embroidery digitizing into DST, PES, JEF in 1 hour" maxLength={120}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/120</p>
      </div>

      {/* ── Package Pricing — 3 separate editors */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
          <h2 className="text-sm font-bold text-foreground">Package Pricing</h2>
          <span className="text-xs text-muted-foreground">— set each package independently</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PKG_META.map(meta => (
            <PackageEditor
              key={meta.id}
              meta={meta}
              config={packages[meta.id]}
              onChange={(cfg) => updatePackage(meta.id, cfg)}
            />
          ))}
        </div>
      </div>

      {/* ── Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlignLeft className="w-4 h-4 text-primary" /> Description
          </label>
          <button type="button" onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>
        <RichToolbar onFormat={applyFormat} />
        <textarea ref={textareaRef} required rows={12} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y rounded-b-lg font-mono text-sm"
          placeholder={`Welcome to my gig!\n\nI provide **professional** embroidery digitizing...\n\n- ==High quality== output files\n- Quick turnaround time\n- Unlimited revisions\n\n1. Upload your artwork\n2. Receive digitized files within 24h\n3. Request any changes for free`}
        />
        {showPreview && description && (
          <div className="mt-3 p-5 bg-white border border-border rounded-xl shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
            <DescriptionPreview text={description} />
          </div>
        )}
      </div>

      {/* ── Images */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
          <ImagePlus className="w-4 h-4 text-primary" /> Gig Images
          <span className="text-xs font-normal text-muted-foreground">(up to 5 — first = primary)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
          {images.map((url, idx) => (
            <div key={url + idx} className={`relative rounded-xl overflow-hidden aspect-square border-2 ${idx === 0 ? "border-primary shadow-md" : "border-border"}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] font-bold text-center py-0.5">PRIMARY</div>
              )}
              <button type="button" onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              onSuccess={(result: any) => addImage(result.info.secure_url)}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs font-medium">Add Image</span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>
        {images.length === 0 && <p className="text-xs text-red-500 mt-2">⚠ At least one image is required</p>}
      </div>

      {/* ── Actions */}
      <div className="pt-6 border-t border-border flex justify-between items-center">
        <button type="button" onClick={() => router.push("/admin/gigs")}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/50 transition-colors border border-border"
        >
          ← Cancel
        </button>
        <button type="submit" disabled={loading || images.length === 0}
          className="bg-primary text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : (isEdit ? "Save Changes" : "Create Gig")}
        </button>
      </div>
    </form>
  );
}
