import { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, Users, BarChart3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyWorkCard } from '@/components/dailywork/DailyWorkCard';
import { MissingUploadsCard } from '@/components/dailywork/MissingUploadsCard';
import { AttendanceCalendar } from '@/components/dailywork/AttendanceCalendar';
import { AttendanceReport } from '@/components/dailywork/AttendanceReport';
import { useDailyWorkUploads } from '@/hooks/useDailyWorkUploads';
import { useMonthlyAttendance } from '@/hooks/useMonthlyAttendance';

export default function AdminDailyWork() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('daily');
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { uploads, isLoading } = useDailyWorkUploads(dateString);
  const { data: attendanceData, isLoading: isLoadingAttendance } = useMonthlyAttendance(selectedMonth);

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Count unique users who uploaded or were mentioned
  const activeUsersCount = new Set([
    ...uploads.map(u => u.user_id),
    ...uploads.flatMap(u => u.mentioned_users),
  ]).size;

  const handleDayClick = (date: string) => {
    setSelectedDate(new Date(date));
    setActiveTab('daily');
  };

  return (
    <AppLayout title="Daily Work Uploads">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6 mt-6">
            {/* Date Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md min-w-[180px] justify-center">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextDay}
                  disabled={isToday}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isToday && (
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>{uploads.length} uploads</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{activeUsersCount} active users</span>
                </div>
              </div>
            </div>

            {/* Missing Uploads Card - Only show for today */}
            {isToday && <MissingUploadsCard />}

            {/* Uploads Grid */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-video" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : uploads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No uploads for this day</h3>
                  <p className="text-sm text-muted-foreground">
                    {isToday
                      ? 'Users will upload their daily work images here'
                      : 'No work images were uploaded on this date'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {uploads.map(upload => (
                  <DailyWorkCard key={upload.id} upload={upload} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            {isLoadingAttendance ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-96" />
                </CardContent>
              </Card>
            ) : attendanceData ? (
              <AttendanceCalendar
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                dayAttendance={attendanceData.dayAttendance}
                totalUsers={attendanceData.totalUsers}
                onDayClick={handleDayClick}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            {isLoadingAttendance ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-64" />
                  </CardContent>
                </Card>
              </div>
            ) : attendanceData ? (
              <AttendanceReport
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                userAttendance={attendanceData.userAttendance}
                totalWorkDays={attendanceData.workingDays}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
