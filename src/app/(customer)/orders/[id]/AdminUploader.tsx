"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle2, Loader2, Send } from "lucide-react";

export default function AdminFileUploader({ orderId, adminId }: { orderId: string, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Here is your finalized digitizing file! Let me know if you need any revisions.");
  const router = useRouter();
  const supabase = createClient();

  const handleUploadSuccess = async (result: any) => {
    setLoading(true);
    const file = result.info;
    
    const ext = file.original_filename?.split('.').pop()?.toLowerCase();
    const fileType = ext === 'pdf' ? 'run_sheet' : 'digitized_file';

    // 1. Insert file
    const { error: fileError } = await supabase.from("order_files").insert([{
      order_id: orderId,
      file_url: file.secure_url,
      cloudinary_public_id: file.public_id,
      file_name: file.original_filename || "Digitized File",
      file_type: fileType,
      uploaded_by: adminId
    }]);

    if (!fileError) {
      // 2. Insert delivery message in chat if message exists
      if (message.trim()) {
        await supabase.from("chat_messages").insert({
          sender_id: adminId,
          order_id: orderId,
          message_text: `📦 DELIVERY: ${message.trim()}`,
          attachment_url: file.secure_url,
          attachment_name: file.original_filename,
          attachment_type: "file"
        });
      }

      // 3. Update order status to delivered so customer can approve it, stop timer
      await supabase.from("orders").update({ status: 'delivered' }).eq("id", orderId);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 p-6 border border-green-200 bg-green-50/30 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h4 className="text-base font-bold text-green-900">Deliver Order</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-green-800 mb-1.5 uppercase tracking-wide">Delivery Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full text-sm bg-white border border-green-200 rounded-xl p-3 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 resize-none shadow-sm"
            placeholder="Write a message to the customer..."
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-green-700 p-4 bg-green-100/50 rounded-xl font-medium border border-green-200">
            <Loader2 className="w-5 h-5 animate-spin" /> Delivering Order...
          </div>
        ) : (
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            onSuccess={handleUploadSuccess}
          >
            {({ open }) => (
              <button 
                onClick={() => open()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-700 transition-all font-bold shadow-sm active:scale-[0.98]"
              >
                <UploadCloud className="w-5 h-5" />
                Upload File & Deliver Now
              </button>
            )}
          </CldUploadWidget>
        )}
      </div>
    </div>
  );
}
