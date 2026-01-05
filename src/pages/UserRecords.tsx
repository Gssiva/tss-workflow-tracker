import { useState } from 'react';
import { Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RecordCard } from '@/components/records/RecordCard';
import { CreateRecordDialog } from '@/components/records/CreateRecordDialog';
import { EditRecordDialog } from '@/components/records/EditRecordDialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecords, Record } from '@/hooks/useRecords';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserRecords() {
  const { records, isLoading, markComplete } = useRecords();
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [search, setSearch] = useState('');

  const filteredRecords = records.filter(
    (record) =>
      record.title.toLowerCase().includes(search.toLowerCase()) ||
      record.description?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRecords = filteredRecords.filter((r) => !r.completed_status);
  const completedRecords = filteredRecords.filter((r) => r.completed_status);

  if (isLoading) {
    return (
      <AppLayout title="My Records">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Records">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <CreateRecordDialog />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({filteredRecords.length})</TabsTrigger>
            <TabsTrigger value="pending">In Progress ({pendingRecords.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRecords.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <p className="text-muted-foreground">No records found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onComplete={() => markComplete.mutate(record.id)}
                    onEdit={() => setEditingRecord(record)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingRecords.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <p className="text-muted-foreground">No pending records</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRecords.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onComplete={() => markComplete.mutate(record.id)}
                    onEdit={() => setEditingRecord(record)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedRecords.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <p className="text-muted-foreground">No completed records</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedRecords.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onComplete={() => markComplete.mutate(record.id)}
                    onEdit={() => setEditingRecord(record)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditRecordDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      />
    </AppLayout>
  );
}
