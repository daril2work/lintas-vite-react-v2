import { supabase } from './supabase';

export const commonService = {
    // App Config
    getAppConfigs: async (): Promise<Record<string, string>> => {
        const { data, error } = await supabase.from('app_config').select('key, value');
        if (error) throw error;
        return data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    },

    updateAppConfig: async (key: string, value: string): Promise<void> => {
        const { error } = await supabase.from('app_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
        if (error) throw error;
    },
};
