import { format, isSameMonth } from 'date-fns';
import { Download, TrendingUp, TrendingDown, Minus, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { UserAttendance } from '@/hooks/useMonthlyAttendance';

interface AttendanceReportProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  userAttendance: UserAttendance[];
  totalWorkDays: number;
}

export function AttendanceReport({ month, onMonthChange, userAttendance, totalWorkDays }: AttendanceReportProps) {
  const today = new Date();
  const isCurrentMonth = isSameMonth(month, today);

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
  const sortedAttendance = [...userAttendance].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  const averageAttendance = userAttendance.length > 0
    ? Math.round(userAttendance.reduce((sum, u) => sum + u.attendancePercentage, 0) / userAttendance.length)
    : 0;

  const perfectAttendance = userAttendance.filter(u => u.attendancePercentage === 100).length;
  const lowAttendance = userAttendance.filter(u => u.attendancePercentage < 50).length;

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Working Days', 'Present Days', 'Absent Days', 'Attendance %'];
    const rows = sortedAttendance.map(u => [
      u.userName,
      u.userEmail,
      u.totalWorkDays,
      u.presentDays,
      u.absentDays,
      `${u.attendancePercentage}%`
    ]);

    const csvContent = [
      `Attendance Report - ${format(month, 'MMMM yyyy')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(month, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-destructive';
  };

  // Helper for progress bar styling - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
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
            Current Month
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold", getAttendanceColor(averageAttendance))}>
                {averageAttendance}%
              </span>
              {averageAttendance >= 80 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : averageAttendance >= 60 ? (
                <Minus className="h-5 w-5 text-amber-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Working Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalWorkDays}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Perfect Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{perfectAttendance}</span>
              <span className="text-sm text-muted-foreground">users</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Attendance (&lt;50%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-destructive">{lowAttendance}</span>
              <span className="text-sm text-muted-foreground">users</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Attendance Report - {format(month, 'MMMM yyyy')}</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="w-[200px]">Attendance</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No attendance data available
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAttendance.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {user.presentDays}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {user.absentDays}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={user.attendancePercentage} 
                            className="h-2 flex-1"
                          />
                          <span className={cn("text-sm font-medium min-w-[40px]", getAttendanceColor(user.attendancePercentage))}>
                            {user.attendancePercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.attendancePercentage === 100 ? (
                          <Badge className="bg-green-500">Perfect</Badge>
                        ) : user.attendancePercentage >= 80 ? (
                          <Badge className="bg-blue-500">Good</Badge>
                        ) : user.attendancePercentage >= 50 ? (
                          <Badge className="bg-amber-500">Average</Badge>
                        ) : (
                          <Badge variant="destructive">Low</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
