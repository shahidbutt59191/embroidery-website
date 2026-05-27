"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import {
  Clock, RefreshCw, UploadCloud, CheckCircle2, Loader2,
  ArrowRight, MessageSquare, ChevronDown, ChevronUp, X
} from "lucide-react";

// ── Package definitions (the 3 tabs)
// We derive them from the gig base_price and a 2x/3x multiplier.
// In a real system you'd have separate package rows in DB.
function buildPackages(gig: any) {
  const base = parseFloat(gig.base_price) || 5;
  return [
    {
      id: "basic",
      label: "Basic",
      price: base,
      title: "Simple Logo",
      description: "Digitize one simple logo up to 5,000 stitches",
      delivery: "1-day delivery",
      revisions: "Unlimited Revisions",
      features: ["Up to 5,000 stitches", ".DST .PES .JEF formats", "1 revision round"],
    },
    {
      id: "standard",
      label: "Standard",
      price: Math.round(base * 2.5),
      title: "Medium Design",
      description: "Digitize medium complexity design up to 15,000 stitches",
      delivery: "2-day delivery",
      revisions: "Unlimited Revisions",
      features: ["Up to 15,000 stitches", "All major formats", "2 revision rounds", "Run sheet included"],
    },
    {
      id: "premium",
      label: "Premium",
      price: Math.round(base * 5),
      title: "Complex Design",
      description: "Fully complex design, 3D puff, patches, unlimited complexity",
      delivery: "3-day delivery",
      revisions: "Unlimited Revisions",
      features: ["Unlimited stitches", "All major formats", "Unlimited revisions", "Run sheet + sew-out scan", "Priority support"],
    },
  ];
}

export default function GigPackagePanel({
  gig,
  properties,
  userId,
}: {
  gig: any;
  properties: any[];
  userId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const packages = buildPackages(gig);
  const [activeTab, setActiveTab] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`pendingOrder_${gig.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSelections(data.selections || {});
        setSpecialInstructions(data.specialInstructions || "");
        setUploadedImage(data.uploadedImage || null);
        setShowOrderForm(true);
      } catch (e) {}
      localStorage.removeItem(`pendingOrder_${gig.id}`);
    }
  }, [gig.id]);

  const pkg = packages[activeTab];

  // Calculate price including property modifiers
  const totalPrice = useMemo(() => {
    let total = pkg.price;
    Object.keys(selections).forEach((propId) => {
      const selectedOptionId = selections[propId].optionId;
      if (selectedOptionId) {
        const prop = properties.find((p) => p.id === propId);
        const option = prop?.gig_property_options?.find((o: any) => o.id === selectedOptionId);
        if (option?.price_modifier) total += parseFloat(option.price_modifier);
      }
    });
    return total;
  }, [pkg.price, selections, properties]);

  const handleSelection = (propId: string, value: string, isText = false) => {
    setSelections((prev) => ({
      ...prev,
      [propId]: isText ? { textValue: value } : { optionId: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const missingRequired = properties.some((p) => p.is_required && !selections[p.id]);
    if (missingRequired) { setErrorMsg("Please fill out all required fields."); return; }
    if (!uploadedImage) { setErrorMsg("Please upload your source artwork."); return; }

    if (!userId) {
      localStorage.setItem(`pendingOrder_${gig.id}`, JSON.stringify({ selections, specialInstructions, uploadedImage }));
      router.push(`/login?redirect=/gig/${gig.id}`);
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{ customer_id: userId, gig_id: gig.id, status: "pending", total_price: totalPrice, special_instructions: specialInstructions }])
        .select().single();
      if (orderError) throw orderError;

      const detailsToInsert = Object.keys(selections).map((propId) => ({
        order_id: order.id,
        property_id: propId,
        selected_option_id: selections[propId].optionId || null,
        custom_text_value: selections[propId].textValue || null,
      }));
      if (detailsToInsert.length > 0) {
        const { error: dErr } = await supabase.from("order_details").insert(detailsToInsert);
        if (dErr) throw dErr;
      }

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
      setErrorMsg(err.message || "An error occurred while placing your order.");
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white">

      {/* Package Tabs */}
      <div className="flex border-b border-gray-200">
        {packages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === i
                ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Package Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{pkg.label}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">US${pkg.price}</div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{pkg.description}</p>

        {/* Delivery & Revisions */}
        <div className="flex items-center gap-5 text-xs text-gray-600 mb-5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{pkg.delivery}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{pkg.revisions}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-gray-800 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Continue / Order Button */}
        {!showOrderForm ? (
          <button
            onClick={() => setShowOrderForm(true)}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowOrderForm(false)}
            className="w-full bg-gray-900 text-white py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2"
          >
            <ChevronUp className="w-4 h-4" /> Hide Order Form
          </button>
        )}

        {/* Contact button */}
        <button
          onClick={() => router.push("/register")}
          className="w-full mt-3 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Contact me
        </button>
      </div>

      {/* ── Expandable Order Form ── */}
      {showOrderForm && (
        <div className="border-t border-gray-200 bg-gray-50 p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Customize Your Order</h3>
          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-xs border border-red-100 flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Dynamic Properties */}
            {properties.map((prop) => (
              <div key={prop.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {prop.property_name} {prop.is_required && <span className="text-red-500">*</span>}
                </label>

                {(prop.field_type === "select") && (
                  <select
                    required={prop.is_required}
                    onChange={(e) => handleSelection(prop.id, e.target.value)}
                    value={selections[prop.id]?.optionId || ""}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="" disabled>Select...</option>
                    {prop.gig_property_options?.map((opt: any) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.option_value}{opt.price_modifier > 0 ? ` (+$${opt.price_modifier})` : ""}
                      </option>
                    ))}
                  </select>
                )}

                {prop.field_type === "radio" && (
                  <div className="space-y-1.5">
                    {prop.gig_property_options?.map((opt: any) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`prop_${prop.id}`}
                          value={opt.id}
                          required={prop.is_required}
                          onChange={(e) => handleSelection(prop.id, e.target.value)}
                          className="w-4 h-4"
                        />
                        {opt.option_value}
                        {opt.price_modifier > 0 && <span className="text-xs text-gray-500">(+${opt.price_modifier})</span>}
                      </label>
                    ))}
                  </div>
                )}

                {(prop.field_type === "text" || prop.field_type === "number") && (
                  <input
                    type={prop.field_type}
                    required={prop.is_required}
                    onChange={(e) => handleSelection(prop.id, e.target.value, true)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder={`Enter ${prop.property_name.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}

            {/* Upload artwork */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Upload Artwork <span className="text-red-500">*</span>
              </label>
              {uploadedImage ? (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                  <img src={uploadedImage.secure_url} alt="" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{uploadedImage.original_filename}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </p>
                  </div>
                  <button type="button" onClick={() => setUploadedImage(null)} className="text-red-400 hover:text-red-600 text-xs">
                    Remove
                  </button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                  onSuccess={(result: any) => setUploadedImage(result.info)}
                >
                  {({ open }) => (
                    <div
                      onClick={() => open()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <UploadCloud className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Click to upload</span>
                      <span className="text-[10px] mt-0.5">JPG, PNG, PDF, AI</span>
                    </div>
                  )}
                </CldUploadWidget>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Special Instructions (Optional)</label>
              <textarea
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                placeholder="Any specific requirements for your design..."
              />
            </div>

            {/* Price + Submit */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
                <p className="text-xl font-bold text-gray-900">US${totalPrice.toFixed(2)}</p>
              </div>
              <button
                type="submit"
                disabled={loading || !uploadedImage}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Placing..." : "Place Order"}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
