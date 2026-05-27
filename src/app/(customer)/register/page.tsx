"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, Lock, User, UserPlus, Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Email/password sign up ──────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "customer",
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Account created! Check your email to confirm, then sign in.");
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  // ── Google OAuth ────────────────────────────────────
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-primary/5 min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-2xl leading-none">S</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 px-8 py-8">

          {/* Error / Success */}
          {errorMsg && (
            <div className="mb-5 bg-red-50 text-red-600 text-sm p-3.5 rounded-xl border border-red-100 font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 bg-green-50 text-green-700 text-sm p-3.5 rounded-xl border border-green-100 font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* ── Google Button ── */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border-2 border-border rounded-xl bg-white text-sm font-semibold text-foreground hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <GoogleIcon />}
            {googleLoading ? "Redirecting to Google..." : "Sign up with Google"}
          </button>

          {/* Info note for Google */}
          <p className="text-[11px] text-center text-muted-foreground mb-5 -mt-2 px-4">
            Fastest way — no password needed. We'll create your account automatically.
          </p>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-muted-foreground font-medium">or register with email</span>
            </div>
          </div>

          {/* ── Email/Password Form ── */}
          <form className="space-y-4" onSubmit={handleSignUp}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-slate-50/50 text-foreground transition-colors"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-slate-50/50 text-foreground transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-slate-50/50 text-foreground transition-colors"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}