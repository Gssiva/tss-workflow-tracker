import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Eye, 
  LogIn, 
  LogOut, 
  FileText, 
  CheckCircle2, 
  Edit2, 
  Upload, 
  User,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  page: string | null;
  details: unknown;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  page_view: Eye,
  login: LogIn,
  logout: LogOut,
  record_created: FileText,
  record_completed: CheckCircle2,
  record_edited: Edit2,
  document_uploaded: Upload,
  profile_updated: User,
};

const actionLabels: Record<string, string> = {
  page_view: 'Viewed page',
  login: 'Logged in',
  logout: 'Logged out',
  record_created: 'Created record',
  record_completed: 'Completed record',
  record_edited: 'Edited record',
  document_uploaded: 'Uploaded document',
  profile_updated: 'Updated profile',
};

const actionColors: Record<string, string> = {
  page_view: 'bg-blue-500/10 text-blue-500',
  login: 'bg-success/10 text-success',
  logout: 'bg-muted text-muted-foreground',
  record_created: 'bg-primary/10 text-primary',
  record_completed: 'bg-success/10 text-success',
  record_edited: 'bg-warning/10 text-warning',
  document_uploaded: 'bg-purple-500/10 text-purple-500',
  profile_updated: 'bg-cyan-500/10 text-cyan-500',
};

interface UserActivityCardProps {
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export function UserActivityCard({ limit = 10, showViewAll = true, onViewAll }: UserActivityCardProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Fetch activity logs
        const { data: activityData, error: activityError } = await supabase
          .from('user_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (activityError) throw activityError;

        if (!activityData || activityData.length === 0) {
          setLogs([]);
          return;
        }

        // Get unique user IDs
        const userIds = [...new Set(activityData.map(log => log.user_id))];

        // Fetch user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Map profiles to logs
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const logsWithUsers = activityData.map(log => ({
          ...log,
          user_email: profileMap.get(log.user_id)?.email || 'Unknown',
          user_name: profileMap.get(log.user_id)?.full_name || undefined,
        }));

        setLogs(logsWithUsers);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Set up realtime subscription for new activity
    const channel = supabase
      .channel('user_activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs',
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          User Activity
        </CardTitle>
        {showViewAll && onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary hover:text-primary/80">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || Activity;
              const label = actionLabels[log.action] || log.action;
              const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground';

              return (
                <div 
                  key={log.id} 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">
                        {log.user_name || log.user_email?.split('@')[0] || 'Unknown user'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.page && <span className="text-primary">{log.page}</span>}
                      {log.page && ' • '}
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
