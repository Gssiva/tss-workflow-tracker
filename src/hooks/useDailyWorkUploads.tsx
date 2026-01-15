import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useActivityTracker } from './useActivityTracker';

export type DailyWorkUpload = {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  upload_date: string;
  mentioned_users: string[];
  created_at: string;
};

export type DailyWorkUploadWithUser = DailyWorkUpload & {
  user_name: string;
  user_email: string;
  mentioned_user_names: string[];
};

export function useDailyWorkUploads(date?: string) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { trackActivity } = useActivityTracker();

  const uploadsQuery = useQuery({
    queryKey: ['daily-work-uploads', date],
    queryFn: async () => {
      let query = supabase
        .from('daily_work_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (date) {
        query = query.eq('upload_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const uploadsWithUsers: DailyWorkUploadWithUser[] = (data || []).map((upload) => {
        const userProfile = profileMap.get(upload.user_id);
        const mentionedUserNames = (upload.mentioned_users || [])
          .map((id: string) => profileMap.get(id)?.full_name || profileMap.get(id)?.email || 'Unknown')
          .filter(Boolean);

        return {
          ...upload,
          mentioned_users: upload.mentioned_users || [],
          user_name: userProfile?.full_name || userProfile?.email || 'Unknown',
          user_email: userProfile?.email || '',
          mentioned_user_names: mentionedUserNames,
        };
      });

      return uploadsWithUsers;
    },
    enabled: !!user,
  });

  const uploadImage = useMutation({
    mutationFn: async ({
      file,
      description,
      mentionedUsers,
    }: {
      file: File;
      description?: string;
      mentionedUsers: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('daily-work-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('daily-work-images')
        .getPublicUrl(fileName);

      // Insert record
      const { data, error } = await supabase
        .from('daily_work_uploads')
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          description,
          mentioned_users: mentionedUsers,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admin about the upload
      await notifyAdminAboutUpload(user.id, mentionedUsers, urlData.publicUrl);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-work-uploads'] });
      trackActivity('document_uploaded', { type: 'daily_work_image' });
      toast.success('Daily work image uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload image: ' + error.message);
    },
  });

  const todayUploadQuery = useQuery({
    queryKey: ['daily-work-uploads', 'today', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_work_uploads')
        .select('*')
        .eq('user_id', user.id)
        .eq('upload_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    uploads: uploadsQuery.data ?? [],
    isLoading: uploadsQuery.isLoading,
    uploadImage,
    hasUploadedToday: !!todayUploadQuery.data,
    todayUpload: todayUploadQuery.data,
    refetch: uploadsQuery.refetch,
  };
}

async function notifyAdminAboutUpload(userId: string, mentionedUsers: string[], imageUrl: string) {
  try {
    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles?.length) return;

    const adminIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('id', adminIds);

    // Get uploader info
    const { data: uploaderProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Get mentioned user names
    let mentionedNames: string[] = [];
    if (mentionedUsers.length > 0) {
      const { data: mentionedProfiles } = await supabase
        .from('profiles')
        .select('full_name, email')
        .in('id', mentionedUsers);
      mentionedNames = mentionedProfiles?.map(p => p.full_name || p.email) || [];
    }

    // Send notification to each admin
    for (const admin of adminProfiles || []) {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'daily_work_uploaded',
          to: admin.email,
          uploaderName: uploaderProfile?.full_name || uploaderProfile?.email,
          mentionedUsers: mentionedNames,
          imageUrl,
        },
      });
    }
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// Hook to get users who haven't uploaded today (for admin)
export function useMissingUploads() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ['missing-uploads', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get all users
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      // Get today's uploads
      const { data: todayUploads } = await supabase
        .from('daily_work_uploads')
        .select('user_id, mentioned_users')
        .eq('upload_date', today);

      // Get all user IDs who have uploaded or been mentioned
      const activeUserIds = new Set<string>();
      todayUploads?.forEach((upload) => {
        activeUserIds.add(upload.user_id);
        (upload.mentioned_users || []).forEach((id: string) => activeUserIds.add(id));
      });

      // Filter users who haven't uploaded or been mentioned
      const missingUsers = (allUsers || []).filter(user => !activeUserIds.has(user.id));

      return missingUsers;
    },
    enabled: role === 'admin',
  });
}