import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Query information_schema
  const { data, error } = await supabase
    .rpc('get_schema_info'); // we don't have this.
    
  // Let's just select one order to see its keys
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
    
  console.log("Orders:", orders);
  console.log("Error:", ordersErr);
}

checkSchema();
