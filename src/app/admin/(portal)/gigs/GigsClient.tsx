"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function GigsClient({ gigs }: { gigs: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("gigs").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      router.refresh();
    }
    setDeletingId(null);
    setConfirmId(null);
  };

  if (!gigs || gigs.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p className="text-lg">No gigs found.</p>
        <p className="text-sm mt-2">Create your first gig to start receiving orders.</p>
      </div>
    );
  }

  return (
    <>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-accent/30 text-muted-foreground text-sm uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold">Gig Name</th>
            <th className="px-6 py-4 font-semibold">Base Price</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {gigs.map((gig) => (
            <tr key={gig.id} className="hover:bg-accent/10 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {gig.image_url && (
                    <img src={gig.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{gig.title}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {gig.description?.replace(/<[^>]*>/g, "").slice(0, 80)}...
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 font-medium">${gig.base_price}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${gig.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                  {gig.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3 items-center">
                  <Link href={`/admin/gigs/${gig.id}`} className="text-muted-foreground hover:text-primary transition-colors" title="Edit Gig">
                    <Edit className="w-5 h-5" />
                  </Link>

                  {confirmId === gig.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-medium">Confirm?</span>
                      <button
                        onClick={() => handleDelete(gig.id)}
                        disabled={deletingId === gig.id}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 flex items-center gap-1"
                      >
                        {deletingId === gig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-200"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(gig.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete Gig"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
