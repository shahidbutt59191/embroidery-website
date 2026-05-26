"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Aapki client file ka path
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer'
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created successfully! Please check your email to confirm.");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="py-12 flex justify-center bg-gray-50 min-h-screen">
      <div className="bg-white p-8 shadow-lg rounded-2xl w-full max-w-md border">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <form className="space-y-5" onSubmit={handleSignUp}>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Muhammad Bilal"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Removed Role Selection (Default is customer) */}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account? <Link href="/login" className="text-green-700 font-bold">Login</Link>
        </p>
      </div>
    </div>
  );
}