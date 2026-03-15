import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjcuhujyzkvwjevihooh.supabase.co';
const supabaseAnonKey = 'sb_publishable_6g3YYowdLYa6yF4v9M8ynA_vktNJ-f_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProfile() {
    console.log('Memperbaiki profil untuk daril2work@gmail.com...');

    // Auth ID yang didapat dari test sebelumnya
    const authId = '865a5884-894a-4001-82ac-bb1a5aca7ae9';

    const { data, error } = await supabase
        .from('profiles')
        .insert([{
            id: authId,
            email: 'daril2work@gmail.com',
            name: 'daril',
            role: 'admin',
            department: 'CSSD',
            employee_id: 'ADM001'
        }])
        .select();

    if (error) {
        console.error('❌ Gagal:', error.message);
    } else {
        console.log('✅ Profil admin berhasil ditambahkan!', data);
    }
}

fixProfile();
