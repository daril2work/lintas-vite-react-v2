import { supabase } from './supabase';
import type { PostSterilizationLog } from '../types';

export const postSterilizationService = {
    getLogs: async (): Promise<PostSterilizationLog[]> => {
        const { data, error } = await supabase
            .from('post_sterilization_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;
        
        return (data || []).map(d => ({
            id: d.id,
            machineId: d.machine_id,
            date: d.date,
            operator_name: d.operator_name,
            notes: d.notes,
            proof_file_url: d.proof_file_url,
            timestamp: d.timestamp,
        }));
    },

    createLog: async (log: Omit<PostSterilizationLog, 'id' | 'timestamp' | 'proof_file_url'>, proofFile?: File | null): Promise<PostSterilizationLog> => {
        let finalProofUrl = null;

        if (proofFile) {
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `post_steril_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `proofs/${fileName}`;

            // Menggunakan bucket yang sudah ada: bowie_dick_proofs
            const { error: uploadError } = await supabase.storage
                .from('bowie_dick_proofs')
                .upload(filePath, proofFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload Error info:", uploadError);
                throw new Error('Gagal mengunggah file form: ' + uploadError.message);
            }

            const { data: publicUrlData } = supabase.storage
                .from('bowie_dick_proofs')
                .getPublicUrl(filePath);

            finalProofUrl = publicUrlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('post_sterilization_logs')
            .insert([{
                machine_id: log.machineId,
                date: log.date,
                operator_name: log.operator_name,
                notes: log.notes,
                proof_file_url: finalProofUrl
            }])
            .select('*')
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            machineId: data.machine_id,
            date: data.date,
            operator_name: data.operator_name,
            notes: data.notes,
            proof_file_url: data.proof_file_url,
            timestamp: data.timestamp
        };
    },

    updateLog: async (id: string, updates: Partial<Omit<PostSterilizationLog, 'id' | 'timestamp'>>, proofFile?: File | null): Promise<void> => {
        let finalProofUrl = updates.proof_file_url;

        if (proofFile) {
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `post_steril_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('bowie_dick_proofs')
                .upload(filePath, proofFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error('Gagal mengunggah file baru: ' + uploadError.message);
            }

            const { data: publicUrlData } = supabase.storage
                .from('bowie_dick_proofs')
                .getPublicUrl(filePath);

            finalProofUrl = publicUrlData.publicUrl;
        }

        const updateData: any = {};
        if (updates.machineId !== undefined) updateData.machine_id = updates.machineId;
        if (updates.date !== undefined) updateData.date = updates.date;
        if (updates.operator_name !== undefined) updateData.operator_name = updates.operator_name;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (finalProofUrl !== undefined) updateData.proof_file_url = finalProofUrl;

        const { error } = await supabase
            .from('post_sterilization_logs')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    },

    deleteLog: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('post_sterilization_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
