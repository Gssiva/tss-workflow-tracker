import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Download, CheckCircle2, AlertTriangle, Clock, FileText, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRecords } from '@/hooks/useRecords';
import { useUsers } from '@/hooks/useUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignTaskDialog } from '@/components/records/AssignTaskDialog';

export default function AdminRecords() {
  const { records, isLoading: recordsLoading } = useRecords();
  const { users, isLoadingUsers } = useUsers();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(search.toLowerCase()) ||
      record.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && record.completed_status) ||
      (statusFilter === 'pending' && !record.completed_status && !record.breach_status) ||
      (statusFilter === 'breached' && record.breach_status);

    const matchesUser = userFilter === 'all' || record.created_by === userFilter;

    return matchesSearch && matchesStatus && matchesUser;
  });

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.full_name || user?.email || 'Unknown';
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Created By', 'Created At', 'Expected Hours', 'Status', 'Breached', 'Completed At'];
    const rows = filteredRecords.map((r) => [
      r.title,
      r.description || '',
      getUserName(r.created_by),
      format(new Date(r.created_at), 'PPpp'),
      r.expected_time_hours,
      r.completed_status ? 'Completed' : 'Pending',
      r.breach_status ? 'Yes' : 'No',
      r.completed_at ? format(new Date(r.completed_at), 'PPpp') : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `records-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const isLoading = recordsLoading || isLoadingUsers;

  if (isLoading) {
    return (
      <AppLayout title="All Records">
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="All Records">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="breached">Breached</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <AssignTaskDialog />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {record.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getUserName(record.created_by)}</TableCell>
                    <TableCell>{record.expected_time_hours}h</TableCell>
                    <TableCell>
                      {record.completed_status ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Done
                        </Badge>
                      ) : record.breach_status ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Breached
                        </Badge>
                      ) : (
                        <Badge className="bg-warning text-warning-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.file_url ? (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary" asChild>
                          <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3" />
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">No file</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(record.created_at), 'PP')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
