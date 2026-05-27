import { createClient } from "@/lib/supabase/server";
import PortfolioAdminClient from "./PortfolioAdminClient";

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data: portfolioImages } = await supabase
    .from("portfolio_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
        <p className="text-slate-500 mt-1">Manage your portfolio images to display on the landing page.</p>
      </div>
      
      <PortfolioAdminClient initialImages={portfolioImages || []} />
    </div>
  );
}
