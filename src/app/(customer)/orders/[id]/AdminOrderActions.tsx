"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, Loader2 } from "lucide-react";

export default function AdminOrderActions({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAcceptOrder = async () => {
    setLoading(true);
    
    // Set deadline to 24 hours from now
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("orders")
      .update({ 
        status: "in_progress",
        delivery_deadline: deadline
      })
      .eq("id", orderId);

    if (!error) {
      router.refresh();
    }
    setLoading(false);
  };

  if (currentStatus !== "pending" && currentStatus !== "in_review") {
    return null;
  }

  return (
    <div className="mt-6 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-blue-900">New Order Needs Review</h4>
        <p className="text-sm text-blue-700 mt-1">Review the details and accept the order to start the 24-hour delivery timer.</p>
      </div>
      <button
        onClick={handleAcceptOrder}
        disabled={loading}
        className="whitespace-nowrap flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm w-full sm:w-auto"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
        Accept & Start Timer
      </button>
    </div>
  );
}
