import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ActivityAction = 
  | 'page_view'
  | 'login'
  | 'logout'
  | 'record_created'
  | 'record_completed'
  | 'record_edited'
  | 'document_uploaded'
  | 'profile_updated';

interface ActivityDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export function useActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  const trackActivity = useCallback(async (
    action: ActivityAction,
    details?: ActivityDetails
  ) => {
    if (!user) return;

    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action,
        page: location.pathname,
        details: details || {},
      });
    } catch (error) {
      // Silently fail - activity tracking shouldn't break the app
      console.error('Activity tracking error:', error);
    }
  }, [user, location.pathname]);

  // Track page views automatically
  useEffect(() => {
    if (user && location.pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = location.pathname;
      trackActivity('page_view', { 
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, location.pathname, trackActivity]);

  return { trackActivity };
}

// Hook to fetch activity logs (for admin dashboard)
export function useActivityLogs(limit: number = 20) {
  const { data: logs, isLoading, refetch } = useActivityLogsQuery(limit);
  return { logs: logs || [], isLoading, refetch };
}

function useActivityLogsQuery(limit: number) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [limit]);

  return { data: logs, isLoading, refetch: () => {} };
}

import { useState } from 'react';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  page: string | null;
  details: unknown;
  created_at: string;
}
