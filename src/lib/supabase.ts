import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdulveenwijokjcfkxqu.supabase.co';
const supabaseAnonKey = 'sb_publishable_mxE309yWruQDD-a4OnPGPA_7IYmse9_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
