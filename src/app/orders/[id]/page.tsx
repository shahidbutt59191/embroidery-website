import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package, Clock, Download } from "lucide-react";
import OrderChat from "./OrderChat";
import AdminFileUploader from "./AdminUploader";
import CustomerApprovalCard from "./CustomerApprovalCard";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  // Fetch Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      gigs (title, image_url),
      order_details (
        custom_text_value,
        gig_properties (property_name),
        gig_property_options (option_value, price_modifier)
      ),
      order_files (*)
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return <div className="p-8 text-center text-red-600">Order not found.</div>;
  }

  // Ensure user owns the order or is an admin.
  // (In a real app with strict RLS, the query above would just fail if they aren't authorized).
  if (order.customer_id !== user.id) {
    // If not the customer, verify they are admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      redirect("/marketplace");
    }
  }

  const sourceFiles = order.order_files.filter((f: any) => f.file_type === 'source_image');
  const deliveryFiles = order.order_files.filter((f: any) => f.file_type === 'digitized_file' || f.file_type === 'run_sheet');

  return (
    <div className="bg-accent/20 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Back to Orders
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content: Order Status & Details */}
          <div className="flex-1 space-y-6">
            
            {/* Status Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold font-outfit text-primary mb-1">Order #{order.id.split('-')[0]}</h1>
                <p className="text-sm text-muted-foreground">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold ${
                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                 order.status === 'in_progress' ? <Package className="w-5 h-5" /> : 
                 <Clock className="w-5 h-5" />}
                <span className="capitalize">{order.status.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Gig Info & Properties */}
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border bg-accent/10 flex items-center gap-4">
                <img src={order.gigs?.image_url} alt="Gig" className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h2 className="font-bold text-lg text-foreground">{order.gigs?.title}</h2>
                  <p className="font-semibold text-primary">Total: ${order.total_price}</p>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Selected Options</h3>
                <ul className="space-y-3">
                  {order.order_details.map((detail: any, idx: number) => (
                    <li key={idx} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{detail.gig_properties?.property_name}</span>
                      <span className="font-medium text-foreground text-right">
                        {detail.custom_text_value || detail.gig_property_options?.option_value}
                        {detail.gig_property_options?.price_modifier > 0 && ` (+$${detail.gig_property_options.price_modifier})`}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.special_instructions && (
                  <div className="mt-6 p-4 bg-accent/20 rounded-xl border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Special Instructions:</h4>
                    <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Order Files</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Source Artwork</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sourceFiles.map((f: any) => (
                      <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/10 transition-colors group">
                        <img src={f.file_url} className="w-10 h-10 object-cover rounded" alt="Source" />
                        <span className="text-sm font-medium flex-1 truncate">{f.file_name}</span>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </a>
                    ))}
                  </div>
                </div>

                {deliveryFiles.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-green-700 mb-2">Delivered Files</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deliveryFiles.map((f: any) => (
                        <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                          <Package className="w-10 h-10 p-2 bg-white rounded text-green-600" />
                          <span className="text-sm font-medium flex-1 truncate text-green-800">{f.file_name}</span>
                          <Download className="w-4 h-4 text-green-700" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isAdmin && <AdminFileUploader orderId={order.id} adminId={user.id} />}
            {!isAdmin && order.status === 'delivered' && (
              <CustomerApprovalCard orderId={order.id} userId={user.id} totalPrice={order.total_price} />
            )}
            
          </div>

          {/* Right Column: Chat System */}
          <div className="lg:w-96">
             <OrderChat orderId={order.id} currentUserId={user.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
