import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCallback } from 'react';

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

  const trackActivity = useCallback(async (action: string, details?: { record_id?: string; title?: string }) => {
    if (!user) return;
    try {
      await supabase.from('user_activity_logs').insert([{
        user_id: user.id,
        action,
        page: window.location.pathname,
        details: JSON.parse(JSON.stringify(details || {})),
      }]);
    } catch (error) {
      // Silently fail
    }
  }, [user]);

  const sendCompletionNotification = useCallback(async (
    record: { id: string; title: string; description: string | null },
    completedByEmail: string,
    completedByName?: string | null
  ) => {
    try {
      // Get admin users to notify
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminRoles || adminRoles.length === 0) return;

      // Get admin profiles with emails
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', adminRoles.map(r => r.user_id));

      if (!adminProfiles) return;

      // Send notification to each admin
      for (const admin of adminProfiles) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'task_completed',
            recipientEmail: admin.email,
            recipientName: admin.full_name,
            taskTitle: record.title,
            taskDescription: record.description,
            completedBy: completedByName || completedByEmail,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }, []);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      trackActivity('record_created', { record_id: data.id, title: data.title });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      trackActivity('record_edited', { record_id: data.id, title: data.title });
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      trackActivity('record_completed', { record_id: data.id, title: data.title });
      toast.success('Record marked as complete');

      // Send notification to admins
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        sendCompletionNotification(data, profile?.email || user.email || '', profile?.full_name);
      }
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
