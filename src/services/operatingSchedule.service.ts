import { supabase } from './supabase';
import type { OperatingSchedule } from '../types';

export const operatingScheduleService = {
  async getSchedules(): Promise<OperatingSchedule[]> {
    const { data, error } = await supabase
      .from('operating_schedules')
      .select(`
        *,
        room:rooms(name)
      `)
      .order('operation_date', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
    return data || [];
  },

  async getScheduleById(id: string): Promise<OperatingSchedule | null> {
    const { data, error } = await supabase
      .from('operating_schedules')
      .select(`
        *,
        room:rooms(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching schedule by id:', error);
      throw error;
    }
    return data;
  },

  async addSchedule(scheduleData: Partial<OperatingSchedule>): Promise<OperatingSchedule> {
    const { data, error } = await supabase
      .from('operating_schedules')
      .insert([scheduleData])
      .select()
      .single();

    if (error) {
      console.error('Error adding schedule:', error);
      throw error;
    }
    return data;
  },

  async updateScheduleStatus(id: string, status: OperatingSchedule['status'], notes?: string): Promise<OperatingSchedule> {
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('operating_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule status:', error);
      throw error;
    }
    return data;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('operating_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }
};
