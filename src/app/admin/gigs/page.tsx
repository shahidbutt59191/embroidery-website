import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

export default async function AdminGigsPage() {
  const supabase = await createClient();
  const { data: gigs, error } = await supabase.from("gigs").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-outfit text-primary">Manage Gigs</h1>
        <Link 
          href="/admin/gigs/new" 
          className="bg-secondary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-secondary/90 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Gig
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 border-b border-red-100">
            Error loading gigs: {error.message}
          </div>
        )}
        
        {(!gigs || gigs.length === 0) && !error ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg">No gigs found.</p>
            <p className="text-sm mt-2">Create your first gig to start receiving orders.</p>
          </div>
        ) : (
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
              {gigs?.map((gig) => (
                <tr key={gig.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{gig.title}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{gig.description}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">${gig.base_price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${gig.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {gig.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/gigs/${gig.id}`} className="text-muted-foreground hover:text-primary transition-colors" title="Manage Properties">
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
