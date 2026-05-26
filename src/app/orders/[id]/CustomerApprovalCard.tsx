"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerApprovalCard({ 
  orderId, 
  userId, 
  totalPrice 
}: { 
  orderId: string, 
  userId: string, 
  totalPrice: number 
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg("");

    // 1. Fetch current wallet balance
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
    
    if (!profile) {
      setErrorMsg("Error fetching profile.");
      setLoading(false);
      return;
    }

    const currentBalance = parseFloat(profile.wallet_balance);

    if (currentBalance < totalPrice) {
      setErrorMsg(`Insufficient funds. Your balance is $${currentBalance.toFixed(2)}. Please add funds in your dashboard.`);
      setLoading(false);
      return;
    }

    // 2. Insert Payment Transaction
    const { error: txError } = await supabase.from('wallet_transactions').insert([{
      profile_id: userId,
      amount: -totalPrice, // Negative for deduction
      type: 'payment',
      order_id: orderId,
      description: `Payment for Order #${orderId.split('-')[0]}`
    }]);

    if (txError) {
      setErrorMsg("Transaction failed: " + txError.message);
      setLoading(false);
      return;
    }

    // 3. Update Profile Balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ wallet_balance: currentBalance - totalPrice })
      .eq('id', userId);

    if (balanceError) {
      setErrorMsg("Balance update failed: " + balanceError.message);
      setLoading(false);
      return;
    }

    // 4. Mark Order as Completed
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);

    if (!orderError) {
      router.refresh();
    } else {
      setErrorMsg("Failed to update order status.");
    }
    
    setLoading(false);
  };

  return (
    <div className="mt-6 p-6 bg-secondary/10 border border-secondary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5 text-secondary" /> Action Required: Approve Order
        </h3>
        <p className="text-sm text-muted-foreground">
          The digitizer has delivered your files! Please review them. If you are satisfied, approve the order to release payment.
        </p>
        
        {errorMsg && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Payment Failed</p>
              {errorMsg}
              {errorMsg.includes("Insufficient") && (
                <Link href="/dashboard" className="block mt-2 font-bold text-primary hover:underline">
                  Go to Dashboard to Add Funds &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Amount Due</span>
        <span className="text-3xl font-bold text-foreground mb-2">${totalPrice.toFixed(2)}</span>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full sm:w-auto bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {loading ? "Processing..." : "Approve & Pay"}
        </button>
      </div>
    </div>
  );
}
