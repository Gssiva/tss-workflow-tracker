import { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DailyWorkCard } from '@/components/dailywork/DailyWorkCard';
import { DailyWorkUploadDialog } from '@/components/dailywork/DailyWorkUploadDialog';
import { useDailyWorkUploads } from '@/hooks/useDailyWorkUploads';

export default function UserDailyWork() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { uploads, isLoading, hasUploadedToday } = useDailyWorkUploads(dateString);

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <AppLayout title="Daily Work">
      <div className="space-y-6">
        {/* Header with Upload Button */}
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

          <div className="flex items-center gap-3">
            {isToday && hasUploadedToday && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Uploaded Today
              </Badge>
            )}
            {isToday && <DailyWorkUploadDialog />}
          </div>
        </div>

        {/* Today's Status Card */}
        {isToday && !hasUploadedToday && (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    You haven't uploaded your daily work yet
                  </p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                    Upload an image to track your daily work activity
                  </p>
                </div>
                <DailyWorkUploadDialog />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploads Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
                  ? 'Upload your daily work image to track your activity'
                  : 'No work images were uploaded on this date'}
              </p>
              {isToday && (
                <div className="mt-4">
                  <DailyWorkUploadDialog />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploads.map(upload => (
              <DailyWorkCard key={upload.id} upload={upload} showUser={true} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}