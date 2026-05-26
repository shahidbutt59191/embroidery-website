"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, Loader2 } from "lucide-react";

export default function GigForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("gigs")
      .insert([
        {
          title,
          description,
          base_price: parseFloat(basePrice),
          image_url: imageUrl,
          is_active: true,
        },
      ])
      .select();

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push("/admin/gigs");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Gig Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
          placeholder="e.g. Premium Left Chest Digitizing"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors resize-none"
          placeholder="Describe what the customer gets with this gig..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Base Price ($)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
          placeholder="15.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
        
        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden h-48 border border-border">
            <img src={imageUrl} alt="Gig Cover" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-2 right-2 bg-white/90 text-red-600 px-3 py-1 rounded-lg text-sm font-medium shadow-sm hover:bg-white"
            >
              Change Image
            </button>
          </div>
        ) : (
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            onSuccess={(result: any) => {
              setImageUrl(result.info.secure_url);
            }}
          >
            {({ open }) => {
              return (
                <div 
                  onClick={() => open()}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors text-muted-foreground hover:text-secondary"
                >
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Click to upload image</span>
                </div>
              );
            }}
          </CldUploadWidget>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Make sure your Cloudinary `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set in .env.local
        </p>
      </div>

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
          disabled={loading || !imageUrl}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Gig"}
        </button>
      </div>
    </form>
  );
}
