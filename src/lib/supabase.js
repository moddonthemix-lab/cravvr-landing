import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coqwihsmmigktqqdnmis.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXdpaHNtbWlna3RxcWRubWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTg1NTMsImV4cCI6MjA4MjYzNDU1M30.ybwwLZguj58PGzCuM-gCdMoUjGHLh2zmkZihy6_zEx8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
