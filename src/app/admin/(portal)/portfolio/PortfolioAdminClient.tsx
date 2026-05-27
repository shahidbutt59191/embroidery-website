"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Trash2, ImagePlus, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PortfolioAdminClient({ initialImages }: { initialImages: any[] }) {
  const [images, setImages] = useState(initialImages);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleUploadSuccess = async (result: any) => {
    if (result.info && result.info.secure_url) {
      const newUrl = result.info.secure_url;
      const newItem = {
        image_url: newUrl,
        title: "Portfolio Image",
        sort_order: images.length
      };

      try {
        const { data, error } = await supabase
          .from("portfolio_images")
          .insert([newItem])
          .select("*")
          .single();

        if (!error && data) {
          setImages([...images, data]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const removeImage = async (id: string) => {
    try {
      await supabase.from("portfolio_images").delete().eq("id", id);
      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Portfolio Gallery</h2>
        <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} onSuccess={handleUploadSuccess}>
          {({ open }) => (
            <button
              onClick={(e) => { e.preventDefault(); open(); }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ImagePlus className="w-4 h-4" /> Add Image
            </button>
          )}
        </CldUploadWidget>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
          <ImagePlus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-medium">No portfolio images yet</p>
          <p className="text-sm">Click "Add Image" to upload your first portfolio piece.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square group bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(img.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
