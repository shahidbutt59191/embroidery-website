"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Edit, Trash2, Loader2, Eye, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function GigsClient({ gigs }: { gigs: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    // Delete images first to avoid FK constraint
    await supabase.from("gig_images").delete().eq("gig_id", id);
    const { error } = await supabase.from("gigs").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      router.refresh();
    }
    setDeletingId(null);
    setConfirmId(null);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setTogglingId(id);
    await supabase.from("gigs").update({ is_active: !current }).eq("id", id);
    router.refresh();
    setTogglingId(null);
  };

  if (!gigs || gigs.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-16 h-16 bg-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-1">No services yet</p>
        <p className="text-sm text-muted-foreground mb-6">Create your first service to start receiving orders.</p>
        <Link href="/admin/gigs/new" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create First Service
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="px-6 py-3.5 font-semibold">Service</th>
            <th className="px-6 py-3.5 font-semibold">Packages</th>
            <th className="px-6 py-3.5 font-semibold">Status</th>
            <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {gigs.map((gig) => {
            const cfg = gig.package_config;
            const basic = cfg?.basic?.price ?? gig.base_price ?? "—";
            const standard = cfg?.standard?.price ?? null;
            const premium = cfg?.premium?.price ?? null;

            return (
              <tr key={gig.id} className="hover:bg-slate-50/70 transition-colors group">
                {/* Service info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-accent/20">
                      {gig.image_url ? (
                        <img src={gig.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🧵</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-snug max-w-xs">{gig.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                        {(gig.description || "").replace(/\*\*/g, "").replace(/\*/g, "").slice(0, 70)}...
                      </p>
                    </div>
                  </div>
                </td>

                {/* Package pricing */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                      Basic: <span className="font-semibold">${Number(basic).toFixed(2)}</span>
                    </span>
                    {standard && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                        Standard: <span className="font-semibold">${Number(standard).toFixed(2)}</span>
                      </span>
                    )}
                    {premium && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Premium: <span className="font-semibold">${Number(premium).toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* Status + toggle */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(gig.id, gig.is_active)}
                    disabled={togglingId === gig.id}
                    className="flex items-center gap-2 group/toggle"
                    title={gig.is_active ? "Click to deactivate" : "Click to activate"}
                  >
                    {togglingId === gig.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : gig.is_active ? (
                      <ToggleRight className="w-6 h-6 text-green-500 group-hover/toggle:text-green-600 transition-colors" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400 group-hover/toggle:text-slate-500 transition-colors" />
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      gig.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {gig.is_active ? "Active" : "Inactive"}
                    </span>
                  </button>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 items-center">
                    {/* Preview */}
                    <Link
                      href={`/gig/${gig.id}`}
                      target="_blank"
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Preview on site"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/admin/gigs/${gig.id}`}
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Edit Service"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    {/* Delete */}
                    {confirmId === gig.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-red-600 font-medium">Delete?</span>
                        <button
                          onClick={() => handleDelete(gig.id)}
                          disabled={deletingId === gig.id}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-md hover:bg-red-600 flex items-center gap-1"
                        >
                          {deletingId === gig.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-100 border border-slate-200"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(gig.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
