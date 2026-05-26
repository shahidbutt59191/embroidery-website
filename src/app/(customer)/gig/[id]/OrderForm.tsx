"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

export default function OrderForm({ gig, properties, userId }: { gig: any, properties: any[], userId: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  
  // State for form selections: { propertyId: { optionId?: string, textValue?: string } }
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if there is a pending order in localStorage (user returning from login)
    const saved = localStorage.getItem(`pendingOrder_${gig.id}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSelections(data.selections || {});
        setSpecialInstructions(data.specialInstructions || "");
        setUploadedImage(data.uploadedImage || null);
      } catch(e) {}
      localStorage.removeItem(`pendingOrder_${gig.id}`);
    }
  }, [gig.id]);

  // Calculate Total Price
  const totalPrice = useMemo(() => {
    let total = parseFloat(gig.base_price);
    Object.keys(selections).forEach(propId => {
      const selectedOptionId = selections[propId].optionId;
      if (selectedOptionId) {
        const prop = properties.find(p => p.id === propId);
        const option = prop?.gig_property_options?.find((o: any) => o.id === selectedOptionId);
        if (option && option.price_modifier) {
          total += parseFloat(option.price_modifier);
        }
      }
    });
    return total;
  }, [gig.base_price, selections, properties]);

  const handleSelection = (propId: string, value: string, isText = false) => {
    setSelections(prev => ({
      ...prev,
      [propId]: isText ? { textValue: value } : { optionId: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    // Validation
    const missingRequired = properties.some(prop => prop.is_required && !selections[prop.id]);
    if (missingRequired) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }
    if (!uploadedImage) {
      setErrorMsg("Please upload a source image for digitizing.");
      return;
    }

    if (!userId) {
      localStorage.setItem(`pendingOrder_${gig.id}`, JSON.stringify({
        selections,
        specialInstructions,
        uploadedImage
      }));
      router.push(`/login?redirect=/gig/${gig.id}`);
      return;
    }

    setLoading(true);

    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: userId,
          gig_id: gig.id,
          status: 'pending',
          total_price: totalPrice,
          special_instructions: specialInstructions
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert Order Details
      const detailsToInsert = Object.keys(selections).map(propId => ({
        order_id: order.id,
        property_id: propId,
        selected_option_id: selections[propId].optionId || null,
        custom_text_value: selections[propId].textValue || null,
      }));

      if (detailsToInsert.length > 0) {
        const { error: detailsError } = await supabase.from("order_details").insert(detailsToInsert);
        if (detailsError) throw detailsError;
      }

      // 3. Insert Order File (Cloudinary image)
      const { error: fileError } = await supabase
        .from("order_files")
        .insert([{
          order_id: order.id,
          file_url: uploadedImage.secure_url,
          cloudinary_public_id: uploadedImage.public_id,
          file_name: uploadedImage.original_filename || "source_image",
          file_type: "source_image",
          uploaded_by: userId
        }]);

      if (fileError) throw fileError;

      // Success - Redirect to order tracking/chat page
      router.push(`/orders/${order.id}`);

    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while placing your order.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Dynamic Properties */}
      <div className="space-y-6">
        {properties.map((prop) => (
          <div key={prop.id} className="bg-accent/10 p-5 rounded-xl border border-border">
            <label className="block font-semibold text-foreground mb-3">
              {prop.property_name} {prop.is_required && <span className="text-red-500">*</span>}
            </label>

            {prop.field_type === 'select' && (
              <select
                required={prop.is_required}
                onChange={(e) => handleSelection(prop.id, e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                value={selections[prop.id]?.optionId || ""}
              >
                <option value="" disabled>Select an option...</option>
                {prop.gig_property_options?.map((opt: any) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.option_value} {opt.price_modifier > 0 ? `(+$${opt.price_modifier})` : ""}
                  </option>
                ))}
              </select>
            )}

            {prop.field_type === 'radio' && (
              <div className="space-y-2">
                {prop.gig_property_options?.map((opt: any) => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`prop_${prop.id}`}
                      value={opt.id}
                      required={prop.is_required}
                      onChange={(e) => handleSelection(prop.id, e.target.value)}
                      className="w-4 h-4 text-secondary focus:ring-secondary"
                    />
                    <span className="text-sm">
                      {opt.option_value} 
                      {opt.price_modifier > 0 && <span className="ml-1 text-secondary font-medium">(+${opt.price_modifier})</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {(prop.field_type === 'text' || prop.field_type === 'number') && (
              <input
                type={prop.field_type}
                required={prop.is_required}
                onChange={(e) => handleSelection(prop.id, e.target.value, true)}
                className="w-full p-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder={`Enter ${prop.property_name.toLowerCase()}...`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Upload Widget */}
      <div className="bg-accent/10 p-5 rounded-xl border border-border">
        <label className="block font-semibold text-foreground mb-3">
          Upload Artwork / Source Image <span className="text-red-500">*</span>
        </label>
        
        {uploadedImage ? (
          <div className="relative rounded-lg overflow-hidden border border-border bg-white flex items-center p-4 gap-4">
            <img src={uploadedImage.secure_url} alt="Uploaded preview" className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground truncate">{uploadedImage.original_filename}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> Uploaded successfully</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              className="text-red-500 text-sm hover:underline font-medium"
            >
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
                className="w-full h-32 bg-white border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors text-muted-foreground hover:text-secondary"
              >
                <UploadCloud className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Click to upload your image</span>
                <span className="text-xs mt-1">Supports JPG, PNG, PDF, AI</span>
              </div>
            )}
          </CldUploadWidget>
        )}
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block font-semibold text-foreground mb-2">Special Instructions (Optional)</label>
        <textarea
          rows={3}
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          className="w-full p-3 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
          placeholder="Any extra details for the digitizer?"
        />
      </div>

      {/* Checkout Footer */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Price</p>
          <p className="text-3xl font-bold text-primary">${totalPrice.toFixed(2)}</p>
        </div>
        <button
          type="submit"
          disabled={loading || !uploadedImage}
          className="w-full sm:w-auto bg-secondary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? "Processing..." : "Place Order Now"}
        </button>
      </div>

    </form>
  );
}
