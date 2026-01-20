import { useState, useEffect } from 'react';
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
  Search,
  Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { motion, Variants } from 'framer-motion';

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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function AdminActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data: activityData, error: activityError } = await supabase
          .from('user_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (activityError) throw activityError;

        if (!activityData || activityData.length === 0) {
          setLogs([]);
          return;
        }

        const userIds = [...new Set(activityData.map(log => log.user_id))];

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

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

    const channel = supabase
      .channel('activity_page_changes')
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
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.page?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  if (isLoading) {
    return (
      <AppLayout title="User Activity">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="User Activity">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Filters */}
        <motion.div variants={fadeInUp}>
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user or page..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {actionLabels[action] || action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity List */}
        <motion.div variants={fadeInUp}>
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                Activity Log ({filteredLogs.length} entries)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No activity found</p>
                </div>
              ) : (
                <motion.div 
                  variants={staggerContainer}
                  className="space-y-2"
                >
                  {filteredLogs.map((log, index) => {
                    const Icon = actionIcons[log.action] || Activity;
                    const label = actionLabels[log.action] || log.action;
                    const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground';

                    return (
                      <motion.div 
                        key={log.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ x: 5, backgroundColor: 'hsl(var(--muted)/0.5)' }}
                        className="flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer"
                      >
                        <motion.div 
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Icon className="h-6 w-6" />
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {log.user_name || log.user_email?.split('@')[0] || 'Unknown user'}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.user_email}
                          </p>
                          {log.page && (
                            <p className="text-sm text-primary mt-1">
                              Page: {log.page}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(log.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'h:mm a')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
