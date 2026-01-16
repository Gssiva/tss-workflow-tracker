import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format, eachDayOfInterval, isWeekend } from 'date-fns';

export type UserAttendance = {
  userId: string;
  userName: string;
  userEmail: string;
  uploadDays: string[];
  mentionedDays: string[];
  totalWorkDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
};

export type DayAttendance = {
  date: string;
  presentUsers: { id: string; name: string; type: 'uploaded' | 'mentioned' }[];
  absentUsers: { id: string; name: string }[];
};

export function useMonthlyAttendance(month: Date) {
  const { role } = useAuth();
  
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);
  const today = new Date();
  
  // Get all working days in the month (excluding weekends, up to today)
  const workingDays = eachDayOfInterval({ start: startDate, end: endDate > today ? today : endDate })
    .filter(day => !isWeekend(day))
    .map(day => format(day, 'yyyy-MM-dd'));

  return useQuery({
    queryKey: ['monthly-attendance', format(month, 'yyyy-MM')],
    queryFn: async () => {
      // Fetch all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      const allUsers = profiles || [];

      // Fetch all uploads for the month
      const { data: uploads } = await supabase
        .from('daily_work_uploads')
        .select('user_id, upload_date, mentioned_users')
        .gte('upload_date', format(startDate, 'yyyy-MM-dd'))
        .lte('upload_date', format(endDate, 'yyyy-MM-dd'));

      // Create a map of user attendance
      const userAttendanceMap = new Map<string, { uploadDays: Set<string>; mentionedDays: Set<string> }>();
      
      allUsers.forEach(user => {
        userAttendanceMap.set(user.id, { uploadDays: new Set(), mentionedDays: new Set() });
      });

      // Process uploads
      (uploads || []).forEach(upload => {
        const userAttendance = userAttendanceMap.get(upload.user_id);
        if (userAttendance) {
          userAttendance.uploadDays.add(upload.upload_date);
        }
        
        // Process mentioned users
        (upload.mentioned_users || []).forEach((mentionedId: string) => {
          const mentionedAttendance = userAttendanceMap.get(mentionedId);
          if (mentionedAttendance) {
            mentionedAttendance.mentionedDays.add(upload.upload_date);
          }
        });
      });

      // Build user attendance records
      const userAttendance: UserAttendance[] = allUsers.map(user => {
        const attendance = userAttendanceMap.get(user.id)!;
        const allPresentDays = new Set([...attendance.uploadDays, ...attendance.mentionedDays]);
        const presentDays = workingDays.filter(day => allPresentDays.has(day)).length;
        const totalWorkDays = workingDays.length;
        const absentDays = totalWorkDays - presentDays;
        
        return {
          userId: user.id,
          userName: user.full_name || user.email,
          userEmail: user.email,
          uploadDays: Array.from(attendance.uploadDays),
          mentionedDays: Array.from(attendance.mentionedDays),
          totalWorkDays,
          presentDays,
          absentDays,
          attendancePercentage: totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0,
        };
      });

      // Build day-by-day attendance
      const dayAttendance: DayAttendance[] = workingDays.map(date => {
        const presentUsers: { id: string; name: string; type: 'uploaded' | 'mentioned' }[] = [];
        const absentUsers: { id: string; name: string }[] = [];

        allUsers.forEach(user => {
          const attendance = userAttendanceMap.get(user.id)!;
          const userName = user.full_name || user.email;
          
          if (attendance.uploadDays.has(date)) {
            presentUsers.push({ id: user.id, name: userName, type: 'uploaded' });
          } else if (attendance.mentionedDays.has(date)) {
            presentUsers.push({ id: user.id, name: userName, type: 'mentioned' });
          } else {
            absentUsers.push({ id: user.id, name: userName });
          }
        });

        return { date, presentUsers, absentUsers };
      });

      return {
        userAttendance,
        dayAttendance,
        totalUsers: allUsers.length,
        workingDays: workingDays.length,
      };
    },
    enabled: role === 'admin',
  });
}
