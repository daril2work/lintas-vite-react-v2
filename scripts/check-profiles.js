import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjcuhujyzkvwjevihooh.supabase.co';
const supabaseAnonKey = 'sb_publishable_6g3YYowdLYa6yF4v9M8ynA_vktNJ-f_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Semua Profil yang ada:', data);
    }
}

checkProfiles();
