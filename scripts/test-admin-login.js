import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjcuhujyzkvwjevihooh.supabase.co';
const supabaseAnonKey = 'sb_publishable_6g3YYowdLYa6yF4v9M8ynA_vktNJ-f_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    console.log('Mencoba login dengan daril2work@gmail.com / 123456...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'daril2work@gmail.com',
        password: '123456'
    });

    if (error) {
        console.error('❌ Result: ERROR LOGIN -', error.message);
    } else {
        console.log('✅ Result: LOGIN BERHASIL!', data.user?.email, 'ID:', data.user.id);

        // Test fetch profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id);

        console.log('Profile Data Array:', profileData);
        if (profileError) {
            console.error('❌ Result: ERROR FETCH PROFILE -', profileError.message);
        }
    }
}

testLogin();
