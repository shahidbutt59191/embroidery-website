"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminFileUploader({ orderId, adminId }: { orderId: string, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUploadSuccess = async (result: any) => {
    setLoading(true);
    const file = result.info;
    
    // Determine type based on extension or just call it digitized_file
    const ext = file.original_filename?.split('.').pop()?.toLowerCase();
    const fileType = ext === 'pdf' ? 'run_sheet' : 'digitized_file';

    const { error } = await supabase.from("order_files").insert([{
      order_id: orderId,
      file_url: file.secure_url,
      cloudinary_public_id: file.public_id,
      file_name: file.original_filename || "Digitized File",
      file_type: fileType,
      uploaded_by: adminId
    }]);

    if (!error) {
      // Also update order status to completed if this is the final file
      await supabase.from("orders").update({ status: 'completed' }).eq("id", orderId);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <h4 className="text-sm font-semibold text-primary mb-3">Admin Options: Upload Deliverables</h4>
      
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-4 bg-accent/20 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin" /> Saving file...
        </div>
      ) : (
        <CldUploadWidget 
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
          onSuccess={handleUploadSuccess}
        >
          {({ open }) => (
            <button 
              onClick={() => open()}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl hover:bg-secondary/90 transition-colors font-medium shadow-sm"
            >
              <UploadCloud className="w-5 h-5" />
              Upload Digitized File (.DST, .PES, .PDF)
            </button>
          )}
        </CldUploadWidget>
      )}
    </div>
  );
}
