"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wallet, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletCard({ balance, userId }: { balance: number, userId: string }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("50");
  const [showInput, setShowInput] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAddFunds = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return alert("Invalid amount");

    setLoading(true);

    // 1. Insert Transaction
    const { error: txError } = await supabase.from('wallet_transactions').insert([{
      profile_id: userId,
      amount: value,
      type: 'deposit',
      description: 'Added funds via Mock Payment'
    }]);

    if (txError) {
      alert("Error adding funds: " + txError.message);
      setLoading(false);
      return;
    }

    // 2. Update Profile Balance
    // In a real app, a trigger or edge function handles this to prevent race conditions.
    // We do it client side for this MVP.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: balance + value })
      .eq('id', userId);

    if (updateError) {
      alert("Balance update error: " + updateError.message);
    } else {
      setShowInput(false);
      router.refresh();
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="flex items-center gap-3 mb-2">
        <Wallet className="w-6 h-6 text-white/80" />
        <h2 className="font-semibold font-outfit text-white/90">Wallet Balance</h2>
      </div>
      
      <div className="text-4xl font-bold mb-6">${balance.toFixed(2)}</div>

      {showInput ? (
        <div className="flex gap-2 items-center bg-white/20 p-2 rounded-xl">
          <span className="text-white font-bold ml-2">$</span>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="w-20 bg-transparent text-white font-bold focus:outline-none placeholder:text-white/50"
            placeholder="0.00"
          />
          <button 
            onClick={handleAddFunds}
            disabled={loading}
            className="bg-white text-primary px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-70 flex items-center gap-2 ml-auto"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
          </button>
          <button onClick={() => setShowInput(false)} className="text-white/70 hover:text-white text-sm px-2">Cancel</button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)}
          className="bg-white/20 hover:bg-white/30 transition-colors text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 backdrop-blur-sm border border-white/10"
        >
          <Plus className="w-4 h-4" /> Add Funds
        </button>
      )}
    </div>
  );
}
