import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  
  // Fix for common mistake of omitting https:// or providing the db string
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    if (supabaseUrl.startsWith('db.')) {
      supabaseUrl = 'https://' + supabaseUrl.replace('db.', '');
    } else {
      supabaseUrl = 'https://' + supabaseUrl;
    }
  }

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
}