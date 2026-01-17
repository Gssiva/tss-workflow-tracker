import { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Clock, Image as ImageIcon } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecordCard } from '@/components/records/RecordCard';
import { CreateRecordDialog } from '@/components/records/CreateRecordDialog';
import { EditRecordDialog } from '@/components/records/EditRecordDialog';
import { DailyWorkUploadDialog } from '@/components/dailywork/DailyWorkUploadDialog';
import { TeamChatbox } from '@/components/chat/TeamChatbox';
import { useRecords, Record } from '@/hooks/useRecords';
import { useDailyWorkUploads } from '@/hooks/useDailyWorkUploads';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function UserDashboard() {
  const { records, isLoading, markComplete } = useRecords();
  const { hasUploadedToday, todayUpload } = useDailyWorkUploads();
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  const totalRecords = records.length;
  const completedRecords = records.filter(r => r.completed_status).length;
  const breachedRecords = records.filter(r => r.breach_status).length;
  const pendingRecords = records.filter(r => !r.completed_status).length;

  const completionRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;
  const breachRate = totalRecords > 0 ? Math.round((breachedRecords / totalRecords) * 100) : 0;

  const recentRecords = records.slice(0, 5);

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Records"
            value={totalRecords}
            subtitle="All time"
            icon={FileText}
            variant="default"
          />
          <StatsCard
            title="Completed"
            value={completedRecords}
            subtitle={`${completionRate}% completion rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Breached"
            value={breachedRecords}
            subtitle={`${breachRate}% breach rate`}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="In Progress"
            value={pendingRecords}
            subtitle="Pending completion"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Daily Work Upload Status */}
        {!hasUploadedToday ? (
          <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <ImageIcon className="h-8 w-8 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Upload your daily work image
                  </p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                    Don't forget to upload your daily work to track your activity
                  </p>
                </div>
                <DailyWorkUploadDialog />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Daily work uploaded!
                  </p>
                  <p className="text-sm text-green-600/80 dark:text-green-500/80">
                    You've already uploaded your work for today
                  </p>
                </div>
                <DailyWorkUploadDialog />
              </div>
            </CardContent>
          </Card>
        )}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Records</h2>
            <CreateRecordDialog />
          </div>

          {recentRecords.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No records yet</h3>
              <p className="text-muted-foreground mb-4">Create your first record to get started</p>
              <CreateRecordDialog />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentRecords.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onComplete={() => markComplete.mutate(record.id)}
                  onEdit={() => setEditingRecord(record)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EditRecordDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      />
      
      {/* Team Chatbox */}
      <TeamChatbox />
    </AppLayout>
  );
}
