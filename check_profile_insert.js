const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
  );

  // Try to insert a dummy profile to see the exact error
  const { data, error } = await supabase.from('profiles').insert([
    { id: '00000000-0000-0000-0000-000000000000', full_name: 'Test', role: 'buyer' }
  ]);

  console.log("Insert result:", error ? error.message : "Success");
}
check();
