"use client";

import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
        variant === "dark"
          ? "text-white/40 hover:text-red-400"
          : "text-muted-foreground hover:text-red-500"
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Sign Out
    </button>
  );
}
