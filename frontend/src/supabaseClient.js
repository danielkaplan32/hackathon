import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://apazruticllrtoxvxfoe.supabase.co';
const supabaseAnonKey = 'sb_publishable_taoA0LOuK65qpZpOFWCRWw_Bt68Un-F';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Expose supabase globally for browser debugging
window.supabase = supabase;
