import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jjcuhujyzkvwjevihooh.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan!');
    console.log('Silakan dapatkan Service Role Key dari:');
    console.log('Supabase Dashboard > Settings > API > service_role (secret)');
    console.log('\nKemudian jalankan:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_key npm run seed:admin');
    process.exit(1);
}

// Create Supabase Admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedAdmin() {
    console.log('🚀 Membuat admin user...\n');

    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'daril2work@gmail.com',
            password: '123456',
            email_confirm: true,
            user_metadata: {
                name: 'daril'
            }
        });

        if (authError) {
            console.error('❌ Error membuat auth user:', authError.message);
            return;
        }

        console.log('✅ Auth user created:', authData.user?.id);

        // 2. Insert profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user!.id,
                email: 'daril2work@gmail.com',
                name: 'daril',
                role: 'admin',
                department: 'CSSD',
                employee_id: 'ADM001'
            }])
            .select()
            .single();

        if (profileError) {
            console.error('❌ Error membuat profile:', profileError.message);
            return;
        }

        console.log('✅ Profile created:', profileData);
        console.log('\n🎉 Admin user berhasil dibuat!');
        console.log('Email: daril2work@gmail.com');
        console.log('Password: 123456');
        console.log('\nAnda sekarang bisa login menggunakan kredensial ini.');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

seedAdmin();
