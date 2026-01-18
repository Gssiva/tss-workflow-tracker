import { FileText, Users, CheckCircle2, AlertTriangle, Clock, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { UserActivityCard } from '@/components/dashboard/UserActivityCard';
import { IssueNotifications } from '@/components/dashboard/IssueNotifications';
import { TeamChatbox } from '@/components/chat/TeamChatbox';
import { useRecords } from '@/hooks/useRecords';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
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
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // User performance
  const userPerformance = users.map((user) => {
    const userRecords = records.filter((r) => r.created_by === user.id);
    const completed = userRecords.filter((r) => r.completed_status).length;
    const breached = userRecords.filter((r) => r.breach_status).length;
    const completionRate = userRecords.length > 0 ? Math.round((completed / userRecords.length) * 100) : 0;
    return {
      ...user,
      total: userRecords.length,
      completed,
      breached,
      completionRate,
      breachRate: userRecords.length > 0 ? Math.round((breached / userRecords.length) * 100) : 0,
    };
  }).filter(u => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (recordsLoading || isLoadingUsers) {
    return (
      <AppLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        {/* Issue Notifications */}
        <IssueNotifications />

        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome back! 👋
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Records"
            value={totalRecords}
            subtitle="All projects"
            icon={FileText}
            variant="default"
          />
          <StatsCard
            title="Team Members"
            value={totalUsers}
            subtitle="Active employees"
            icon={Users}
            variant="info"
          />
          <StatsCard
            title="Completed"
            value={completedRecords}
            subtitle={`${completionRate}% success rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Breached"
            value={breachedRecords}
            subtitle={`${breachRate}% of total`}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="In Progress"
            value={pendingRecords}
            subtitle="Active tasks"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Overview Progress */}
        <Card className="border-none bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Overall Completion Rate</h3>
                <p className="text-sm text-muted-foreground">
                  {completedRecords} of {totalRecords} records completed
                </p>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <Progress value={completionRate} className="h-3" />
                <span className="text-2xl font-bold text-primary min-w-[4rem] text-right">
                  {completionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity - Full Width */}
        <UserActivityCard 
          limit={10} 
          showViewAll={true} 
          onViewAll={() => navigate('/admin/activity')} 
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Records */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-primary" />
                Recent Records
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/records" className="text-primary hover:text-primary/80">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No recent records</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentRecords.map((record, index) => (
                    <div 
                      key={record.id} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                        record.completed_status 
                          ? 'bg-success/10 text-success' 
                          : record.breach_status 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-warning/10 text-warning'
                      }`}>
                        {record.completed_status ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : record.breach_status ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{record.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 ${
                          record.completed_status
                            ? 'bg-success/10 text-success border-success/20'
                            : record.breach_status
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                        }`}
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
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Contributors
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/users" className="text-primary hover:text-primary/80">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {userPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No employee data available</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {userPerformance.map((user, index) => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{user.total} records</span>
                          <span>•</span>
                          <span className="text-success">{user.completed} done</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {user.completionRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">completion</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Team Chatbox */}
      <TeamChatbox />
    </AppLayout>
  );
}
