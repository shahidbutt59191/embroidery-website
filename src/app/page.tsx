"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push("/marketplace");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-accent/20 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-border">

        {/* Header Section */}
        <div className="bg-primary p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <h1 className="text-3xl font-bold font-outfit relative z-10">StitchMarket</h1>
          <p className="text-white/80 mt-2 relative z-10">Welcome back! Please sign in to continue.</p>
        </div>

        <div className="p-8">
          {/* Error Message Box */}
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSignIn}>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors text-foreground"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-accent/10 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button  */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}