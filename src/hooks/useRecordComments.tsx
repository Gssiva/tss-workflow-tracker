import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type RecordComment = {
  id: string;
  record_id: string;
  user_id: string;
  comment: string;
  is_issue: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
};

export function useRecordComments(recordId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch comments for a specific record
  const commentsQuery = useQuery({
    queryKey: ['record-comments', recordId],
    queryFn: async () => {
      if (!recordId) return [];
      
      const { data, error } = await supabase
        .from('record_comments')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        return data.map(comment => ({
          ...comment,
          profile: profileMap.get(comment.user_id)
        })) as RecordComment[];
      }
      
      return data as RecordComment[];
    },
    enabled: !!recordId && !!user,
  });

  // Fetch all issue comments (for dashboard popup)
  const issueCommentsQuery = useQuery({
    queryKey: ['issue-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('record_comments')
        .select('*')
        .eq('is_issue', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Fetch profiles and record titles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const recordIds = [...new Set(data.map(c => c.record_id))];
        
        const [{ data: profiles }, { data: records }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email').in('id', userIds),
          supabase.from('records').select('id, title').in('id', recordIds)
        ]);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const recordMap = new Map(records?.map(r => [r.id, r]) || []);
        
        return data.map(comment => ({
          ...comment,
          profile: profileMap.get(comment.user_id),
          record: recordMap.get(comment.record_id)
        }));
      }
      
      return data;
    },
    enabled: !!user,
  });

  const addComment = useMutation({
    mutationFn: async ({ recordId, comment, isIssue }: { recordId: string; comment: string; isIssue: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('record_comments')
        .insert({
          record_id: recordId,
          user_id: user.id,
          comment,
          is_issue: isIssue,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-comments'] });
      queryClient.invalidateQueries({ queryKey: ['issue-comments'] });
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('record_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record-comments'] });
      queryClient.invalidateQueries({ queryKey: ['issue-comments'] });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    issueComments: issueCommentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    isLoadingIssues: issueCommentsQuery.isLoading,
    addComment,
    deleteComment,
  };
}
