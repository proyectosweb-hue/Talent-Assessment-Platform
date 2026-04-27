import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztifzpwzojigbmkhnaix.supabase.co';
const supabaseKey = 'sb_publishable_0BGOIUTScKNWtQwDt-YsvA_r1hA44St';

export const supabase = createClient(supabaseUrl, supabaseKey);