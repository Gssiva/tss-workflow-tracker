import { FileText, Users, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useRecords } from '@/hooks/useRecords';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { records, isLoading: recordsLoading } = useRecords();
  const { users, isLoadingUsers } = useUsers();

  const totalRecords = records.length;
  const completedRecords = records.filter((r) => r.completed_status).length;
  const breachedRecords = records.filter((r) => r.breach_status).length;
  const pendingRecords = records.filter((r) => !r.completed_status).length;
  const totalUsers = users.length;

  const completionRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;
  const breachRate = totalRecords > 0 ? Math.round((breachedRecords / totalRecords) * 100) : 0;

  // Recent activity
  const recentRecords = records.slice(0, 5);

  // User performance
  const userPerformance = users.map((user) => {
    const userRecords = records.filter((r) => r.created_by === user.id);
    const completed = userRecords.filter((r) => r.completed_status).length;
    const breached = userRecords.filter((r) => r.breach_status).length;
    return {
      ...user,
      total: userRecords.length,
      completed,
      breached,
      breachRate: userRecords.length > 0 ? Math.round((breached / userRecords.length) * 100) : 0,
    };
  }).filter(u => u.total > 0).slice(0, 5);

  if (recordsLoading || isLoadingUsers) {
    return (
      <AppLayout title="Admin Dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Records"
            value={totalRecords}
            subtitle="All users"
            icon={FileText}
            variant="default"
          />
          <StatsCard
            title="Total Users"
            value={totalUsers}
            subtitle="Registered users"
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Completed"
            value={completedRecords}
            subtitle={`${completionRate}% rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Breached"
            value={breachedRecords}
            subtitle={`${breachRate}% rate`}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="In Progress"
            value={pendingRecords}
            subtitle="Pending"
            icon={Clock}
            variant="warning"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{record.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.created_at), 'PPp')}
                        </p>
                      </div>
                      <Badge
                        className={
                          record.completed_status
                            ? 'bg-success text-success-foreground'
                            : record.breach_status
                            ? 'bg-destructive'
                            : 'bg-warning text-warning-foreground'
                        }
                      >
                        {record.completed_status ? 'Done' : record.breach_status ? 'Breached' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                User Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPerformance.length === 0 ? (
                <p className="text-muted-foreground text-sm">No user data available</p>
              ) : (
                <div className="space-y-4">
                  {userPerformance.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.total} records • {user.completed} completed
                        </p>
                      </div>
                      <Badge
                        variant={user.breachRate > 50 ? 'destructive' : user.breachRate > 20 ? 'secondary' : 'default'}
                        className={user.breachRate <= 20 ? 'bg-success text-success-foreground' : ''}
                      >
                        {user.breachRate}% breach
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
