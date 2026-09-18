import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dbtltzhycoxefpvbzizn.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidGx0emh5Y294ZWZwdmJ6aXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTIxNjUsImV4cCI6MjEwMDAyODE2NX0.jtZ68Pw5ojpIil_6bsM6KfQK-pKVIkziC3Hw-31ZE88';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

export default supabase;
