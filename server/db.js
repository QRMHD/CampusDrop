import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing Supabase credentials.\n' +
    '   Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables.\n' +
    '   See .env.example for details.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`✅ Supabase client initialized for ${supabaseUrl}`);

export default supabase;
