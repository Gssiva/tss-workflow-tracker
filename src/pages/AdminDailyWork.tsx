import { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyWorkCard } from '@/components/dailywork/DailyWorkCard';
import { MissingUploadsCard } from '@/components/dailywork/MissingUploadsCard';
import { useDailyWorkUploads } from '@/hooks/useDailyWorkUploads';

export default function AdminDailyWork() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { uploads, isLoading } = useDailyWorkUploads(dateString);

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Count unique users who uploaded or were mentioned
  const activeUsersCount = new Set([
    ...uploads.map(u => u.user_id),
    ...uploads.flatMap(u => u.mentioned_users),
  ]).size;

  return (
    <AppLayout title="Daily Work Uploads">
      <div className="space-y-6">
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
      </div>
    </AppLayout>
  );
}