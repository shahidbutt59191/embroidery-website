import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import GigsClient from "./GigsClient";

export default async function AdminGigsPage() {
  const supabase = await createClient();
  const { data: gigs, error } = await supabase
    .from("gigs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-outfit text-primary">Manage Gigs</h1>
        <Link
          href="/admin/gigs/new"
          className="bg-secondary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-secondary/90 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> Create Gig
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 border-b border-red-100">
            Error loading gigs: {error.message}
          </div>
        )}
        <GigsClient gigs={gigs || []} />
      </div>
    </div>
  );
}
