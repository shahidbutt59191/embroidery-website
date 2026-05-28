"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import {
  Clock, Repeat2, CheckCircle2, UploadCloud, Loader2,
  ArrowRight, MessageSquare, X, Sparkles, Award, Zap
} from "lucide-react";

function buildPackages(gig: any) {
  const base = parseFloat(gig.base_price) || 5;
  const cfg = gig.package_config;

  // Use DB config if available, otherwise fall back to auto-calculated
  return [
    {
      id: "basic", label: "Basic", emoji: "⚡", icon: Zap,
      price: cfg?.basic?.price ?? base,
      description: cfg?.basic?.description ?? "Simple logo digitizing — perfect for left chest designs",
      delivery: cfg?.basic?.delivery ? `${cfg.basic.delivery} day${cfg.basic.delivery > 1 ? "s" : ""}` : "1 day",
      revisions: "Unlimited",
      features: cfg?.basic?.features ?? ["Up to 5,000 stitches", ".DST .PES .JEF formats", "1 revision round"],
      color: "border-border hover:border-primary/40", activeColor: "border-primary bg-primary/5", badge: "",
    },
    {
      id: "standard", label: "Standard", emoji: "🏆", icon: Award,
      price: cfg?.standard?.price ?? Math.round(base * 2.5 * 100) / 100,
      description: cfg?.standard?.description ?? "Medium complexity — great for detailed logos & text",
      delivery: cfg?.standard?.delivery ? `${cfg.standard.delivery} day${cfg.standard.delivery > 1 ? "s" : ""}` : "2 days",
      revisions: "Unlimited",
      features: cfg?.standard?.features ?? ["Up to 15,000 stitches", "All major formats", "2 revision rounds", "Run sheet included"],
      color: "border-border hover:border-secondary/40", activeColor: "border-secondary bg-secondary/5", badge: "Most Popular",
    },
    {
      id: "premium", label: "Premium", emoji: "✨", icon: Sparkles,
      price: cfg?.premium?.price ?? Math.round(base * 5 * 100) / 100,
      description: cfg?.premium?.description ?? "Complex designs, 3D puff, patches — no limits",
      delivery: cfg?.premium?.delivery ? `${cfg.premium.delivery} day${cfg.premium.delivery > 1 ? "s" : ""}` : "3 days",
      revisions: "Unlimited",
      features: cfg?.premium?.features ?? ["Unlimited stitches", "All formats + 3D puff", "Unlimited revisions", "Run sheet + sew-out scan", "Priority support"],
      color: "border-border hover:border-amber-400/40", activeColor: "border-amber-400 bg-amber-50", badge: "Best Value",
    },
  ];
}

export default function GigPackagePanel({ gig, properties, userId }: {
  gig: any;
  properties: any[];
  userId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const packages = buildPackages(gig);
  const [selected, setSelected] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`pendingOrder_${gig.id}`);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setSelections(d.selections || {});
        setSpecialInstructions(d.specialInstructions || "");
        setUploadedImage(d.uploadedImage || null);
        setShowForm(true);
      } catch (_) {}
      localStorage.removeItem(`pendingOrder_${gig.id}`);
    }
  }, [gig.id]);

  const pkg = packages[selected];

  const totalPrice = useMemo(() => {
    let total = pkg.price;
    Object.keys(selections).forEach(propId => {
      const optId = selections[propId].optionId;
      if (optId) {
        const prop = properties.find(p => p.id === propId);
        const opt = prop?.gig_property_options?.find((o: any) => o.id === optId);
        if (opt?.price_modifier) total += parseFloat(opt.price_modifier);
      }
    });
    return total;
  }, [pkg.price, selections, properties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const missing = properties.some(p => p.is_required && !selections[p.id]);
    if (missing) { setErrorMsg("Please fill out all required fields."); return; }
    if (!uploadedImage) { setErrorMsg("Please upload your artwork."); return; }

    if (!userId) {
      localStorage.setItem(`pendingOrder_${gig.id}`, JSON.stringify({ selections, specialInstructions, uploadedImage }));
      router.push(`/login?redirect=/gig/${gig.id}`);
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert([{ 
          customer_id: userId, 
          gig_id: gig.id, 
          status: "pending", 
          total_price: totalPrice, 
          special_instructions: specialInstructions
        }])
        .select().single();
      if (oErr) throw oErr;

      const details = Object.keys(selections).map(propId => ({
        order_id: order.id, property_id: propId,
        selected_option_id: selections[propId].optionId || null,
        custom_text_value: selections[propId].textValue || null,
      }));
      if (details.length > 0) { const { error } = await supabase.from("order_details").insert(details); if (error) throw error; }

      const { error: fErr } = await supabase.from("order_files").insert([{
        order_id: order.id,
        file_url: uploadedImage.secure_url,
        cloudinary_public_id: uploadedImage.public_id,
        file_name: uploadedImage.original_filename || "source_image",
        file_type: "source_image",
        uploaded_by: userId,
      }]);
      if (fErr) throw fErr;

      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Error placing order. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Full-width Package Cards ─────────────────────── */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((p, i) => {
            const isSelected = selected === i;
            const accentColors: Record<string, { ring: string; btn: string; badge: string; check: string }> = {
              basic:    { ring: "border-primary shadow-primary/15",    btn: "bg-primary",    badge: "bg-slate-700",   check: "text-primary" },
              standard: { ring: "border-secondary shadow-secondary/15", btn: "bg-secondary",  badge: "bg-secondary",   check: "text-secondary" },
              premium:  { ring: "border-amber-500 shadow-amber-500/15", btn: "bg-amber-500",  badge: "bg-amber-500",   check: "text-amber-600" },
            };
            const ac = accentColors[p.id] || accentColors.basic;

            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border-2 overflow-hidden bg-white transition-all duration-200 ${
                  isSelected ? `${ac.ring} shadow-xl` : "border-border hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {/* Badge bar */}
                {p.badge ? (
                  <div className={`${ac.badge} text-white text-xs font-bold uppercase tracking-widest text-center py-2`}>
                    {p.badge}
                  </div>
                ) : <div className="h-[34px] bg-slate-50 border-b border-border" />}

                <div className="p-6 flex flex-col flex-1">
                  {/* Emoji + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      isSelected ? `bg-white shadow-md ring-2 ring-offset-1 ${ac.ring}` : "bg-slate-50"
                    }`}>{p.emoji}</div>
                    <div>
                      <p className="font-bold text-lg text-foreground">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-black text-foreground">
                      ${typeof p.price === "number" ? p.price.toFixed(2) : p.price}
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                    <Clock className="w-4 h-4" />
                    <span>{p.delivery} delivery</span>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => { setSelected(i); setShowForm(false); window.scrollBy({ top: 200, behavior: "smooth" }); }}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all mb-5 ${
                      isSelected
                        ? `${ac.btn} text-white shadow-md`
                        : `bg-slate-100 text-foreground hover:${ac.btn} hover:text-white`
                    }`}
                  >
                    {isSelected ? "✓ Selected — Continue Below" : `Get ${p.label}`}
                  </button>

                  {/* Divider */}
                  <div className="border-t border-border mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {p.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? ac.check : "text-slate-400"}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <Repeat2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? ac.check : "text-slate-400"}`} />
                      <span>{p.revisions} revisions</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ask question link */}
        <div className="text-center mt-5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" /> Not sure which package? Chat with us
          </button>
        </div>
      </div>

      {/* ── CTA: shown when package selected ───────────────── */}
      {!showForm ? (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary/90 text-white px-10 py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Continue with {pkg.label} — US${typeof pkg.price === "number" ? pkg.price.toFixed(2) : pkg.price}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-muted-foreground mt-2">No commitment — review your order before confirming</p>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowForm(false)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            ← Change package
          </button>
        </div>
      )}

      {/* Contact me */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
        className="w-full border-2 border-border text-muted-foreground hover:border-primary hover:text-primary py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
      >
        <MessageSquare className="w-4 h-4" /> Ask a question
      </button>

      {/* ── Order Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-3 border-b border-border">
            <p className="font-bold text-sm text-foreground">{pkg.label} Package — US${pkg.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{pkg.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="flex gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100">
                <X className="w-4 h-4 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            {properties.map(prop => (
              <div key={prop.id}>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {prop.property_name} {prop.is_required && <span className="text-red-500">*</span>}
                </label>

                {prop.field_type === "select" && (
                  <select
                    required={prop.is_required}
                    value={selections[prop.id]?.optionId || ""}
                    onChange={e => setSelections(p => ({ ...p, [prop.id]: { optionId: e.target.value } }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="" disabled>Select...</option>
                    {prop.gig_property_options?.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.option_value}{o.price_modifier > 0 ? ` (+$${o.price_modifier})` : ""}
                      </option>
                    ))}
                  </select>
                )}

                {prop.field_type === "radio" && (
                  <div className="space-y-1.5">
                    {prop.gig_property_options?.map((o: any) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name={`prop_${prop.id}`} value={o.id}
                          required={prop.is_required}
                          onChange={() => setSelections(p => ({ ...p, [prop.id]: { optionId: o.id } }))}
                          className="text-primary" />
                        <span>{o.option_value}</span>
                        {o.price_modifier > 0 && <span className="text-xs text-muted-foreground ml-auto">+${o.price_modifier}</span>}
                      </label>
                    ))}
                  </div>
                )}

                {(prop.field_type === "text" || prop.field_type === "number") && (
                  <input type={prop.field_type} required={prop.is_required}
                    onChange={e => setSelections(p => ({ ...p, [prop.id]: { textValue: e.target.value } }))}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={`Enter ${prop.property_name.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}

            {/* Upload */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Upload Your Artwork <span className="text-red-500">*</span>
              </label>
              {uploadedImage ? (
                <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <img src={uploadedImage.secure_url} alt="" className="w-10 h-10 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{uploadedImage.original_filename}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> Uploaded</p>
                  </div>
                  <button type="button" onClick={() => setUploadedImage(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                  onSuccess={(r: any) => setUploadedImage(r.info)}
                >
                  {({ open }) => (
                    <div onClick={() => open()}
                      className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                    >
                      <UploadCloud className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">Click to upload artwork</span>
                      <span className="text-[10px] mt-0.5">JPG, PNG, PDF, AI</span>
                    </div>
                  )}
                </CldUploadWidget>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Special Instructions (Optional)</label>
              <textarea rows={2} value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Any specific requirements..." />
            </div>

            {/* Total + Submit */}
            <div className="bg-accent/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Order Total</p>
                <p className="text-2xl font-bold text-foreground">US${totalPrice.toFixed(2)}</p>
              </div>
              <button type="submit" disabled={loading || !uploadedImage}
                className="bg-gradient-to-r from-secondary to-secondary/80 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Placing..." : "Place Order →"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
