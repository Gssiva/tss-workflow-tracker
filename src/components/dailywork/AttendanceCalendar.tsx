import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, isAfter } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DayAttendance } from '@/hooks/useMonthlyAttendance';

interface AttendanceCalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  dayAttendance: DayAttendance[];
  totalUsers: number;
  onDayClick?: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({ 
  month, 
  onMonthChange, 
  dayAttendance, 
  totalUsers,
  onDayClick 
}: AttendanceCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get starting day offset (which day of the week does the month start on)
  const startDayOffset = monthStart.getDay();
  
  // Create attendance map for quick lookup
  const attendanceMap = new Map(dayAttendance.map(d => [d.date, d]));

  const goToPreviousMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  const goToCurrentMonth = () => {
    onMonthChange(new Date());
  };

  const isCurrentMonth = isSameMonth(month, today);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Attendance Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(month, 'MMMM yyyy')}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                Today
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>All Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>None Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span>Weekend/Future</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
          
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          <TooltipProvider>
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const attendance = attendanceMap.get(dateStr);
              const isWeekendDay = isWeekend(day);
              const isFuture = isAfter(day, today);
              const isToday = isSameDay(day, today);
              
              const presentCount = attendance?.presentUsers.length || 0;
              const absentCount = attendance?.absentUsers.length || 0;
              
              let statusColor = 'bg-muted';
              if (!isWeekendDay && !isFuture && attendance) {
                if (presentCount === totalUsers) {
                  statusColor = 'bg-green-500';
                } else if (presentCount > 0) {
                  statusColor = 'bg-amber-500';
                } else {
                  statusColor = 'bg-destructive';
                }
              }

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !isWeekendDay && !isFuture && onDayClick?.(dateStr)}
                      disabled={isWeekendDay || isFuture}
                      className={cn(
                        "aspect-square p-1 rounded-lg flex flex-col items-center justify-center text-sm transition-all",
                        isWeekendDay || isFuture ? "opacity-50 cursor-not-allowed" : "hover:ring-2 hover:ring-primary cursor-pointer",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <span className={cn(
                        "font-medium",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {!isWeekendDay && !isFuture && (
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1",
                          statusColor
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>
                  {!isWeekendDay && !isFuture && attendance && (
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">{format(day, 'EEEE, MMMM d')}</p>
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-3 w-3" />
                          <span>{presentCount} present</span>
                        </div>
                        <div className="flex items-center gap-2 text-destructive">
                          <X className="h-3 w-3" />
                          <span>{absentCount} absent</span>
                        </div>
                        {attendance.absentUsers.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Absent: {attendance.absentUsers.slice(0, 3).map(u => u.name).join(', ')}
                            {attendance.absentUsers.length > 3 && ` +${attendance.absentUsers.length - 3} more`}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
