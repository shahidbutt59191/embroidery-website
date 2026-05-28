import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables." }, { status: 500 });
    }
    
    // Create admin client that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      serviceKey,
      { auth: { persistSession: false } }
    );
    
    // Upsert the profile to satisfy the foreign key constraint
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: "Customer", // Default fallback name
      role: "buyer"
    }, { onConflict: "id" });
    
    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
