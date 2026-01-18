import { useQuery } from '@tanstack/react-query';
import { Camera, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface StudentUploadsViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

export function StudentUploadsViewDialog({ open, onOpenChange, studentId }: StudentUploadsViewDialogProps) {
  const { data: uploads, isLoading } = useQuery({
    queryKey: ['student-uploads-view', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_daily_uploads')
        .select('*')
        .eq('student_id', studentId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId && open,
  });

  const { data: student } = useQuery({
    queryKey: ['student-info', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      
      // Get profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', studentData.user_id)
        .single();
        
      return { ...studentData, profile };
    },
    enabled: !!studentId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Student Uploads - {student?.profile?.full_name || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : uploads && uploads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {uploads.map((upload) => (
              <Card key={upload.id} className="overflow-hidden">
                <img
                  src={upload.image_url}
                  alt={`${upload.upload_type} upload`}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={upload.upload_type === 'morning' ? 'default' : 'secondary'}>
                      {upload.upload_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(upload.upload_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {upload.description && (
                    <p className="text-sm text-muted-foreground">{upload.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No uploads from this student yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
