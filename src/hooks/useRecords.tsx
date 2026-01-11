import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Record = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string;
  expected_time_hours: number;
  breach_status: boolean;
  completed_status: boolean;
  completed_at: string | null;
  updated_at: string;
  file_url: string | null;
};

export type RecordInsert = {
  title: string;
  description?: string;
  expected_time_hours: number;
};

export type RecordUpdate = {
  title?: string;
  description?: string;
  expected_time_hours?: number;
  completed_status?: boolean;
  completed_at?: string | null;
};

export function useRecords() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['records', user?.id, role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Record[];
    },
    enabled: !!user,
  });

  const createRecord = useMutation({
    mutationFn: async (record: RecordInsert) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('records')
        .insert({
          ...record,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success('Record created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create record: ' + error.message);
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RecordUpdate }) => {
      const { data, error } = await supabase
        .from('records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success('Record updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update record: ' + error.message);
    },
  });

  const markComplete = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('records')
        .update({
          completed_status: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      toast.success('Record marked as complete');
    },
    onError: (error) => {
      toast.error('Failed to complete record: ' + error.message);
    },
  });

  return {
    records: recordsQuery.data ?? [],
    isLoading: recordsQuery.isLoading,
    error: recordsQuery.error,
    createRecord,
    updateRecord,
    markComplete,
  };
}
