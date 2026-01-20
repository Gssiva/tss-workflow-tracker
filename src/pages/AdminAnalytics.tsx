import { useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecords } from '@/hooks/useRecords';
import { useUsers } from '@/hooks/useUsers';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { motion, Variants } from 'framer-motion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function AdminAnalytics() {
  const { records, isLoading: recordsLoading } = useRecords();
  const { users, isLoadingUsers } = useUsers();

  // Records by expected time
  const recordsByTime = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const key = `${record.expected_time_hours}h`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: '1h', value: grouped['1h'] || 0 },
      { name: '2h', value: grouped['2h'] || 0 },
      { name: '3h', value: grouped['3h'] || 0 },
      { name: '5h', value: grouped['5h'] || 0 },
      { name: '8h', value: grouped['8h'] || 0 },
    ];
  }, [records]);

  // Status distribution
  const statusData = useMemo(() => {
    const completed = records.filter((r) => r.completed_status && !r.breach_status).length;
    const breached = records.filter((r) => r.breach_status).length;
    const pending = records.filter((r) => !r.completed_status && !r.breach_status).length;

    return [
      { name: 'Completed', value: completed, color: 'hsl(142, 76%, 36%)' },
      { name: 'Breached', value: breached, color: 'hsl(0, 84%, 60%)' },
      { name: 'Pending', value: pending, color: 'hsl(38, 92%, 50%)' },
    ].filter((d) => d.value > 0);
  }, [records]);

  // Daily trends (last 7 days)
  const dailyTrends = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayRecords = records.filter((r) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      });

      const completed = dayRecords.filter((r) => r.completed_status).length;
      const breached = dayRecords.filter((r) => r.breach_status).length;

      return {
        name: format(day, 'EEE'),
        created: dayRecords.length,
        completed,
        breached,
      };
    });
  }, [records]);

  // User performance comparison
  const userComparison = useMemo(() => {
    return users
      .map((user) => {
        const userRecords = records.filter((r) => r.created_by === user.id);
        const completed = userRecords.filter((r) => r.completed_status).length;
        const breached = userRecords.filter((r) => r.breach_status).length;

        return {
          name: user.full_name || user.email?.split('@')[0] || 'Unknown',
          total: userRecords.length,
          completed,
          breached,
        };
      })
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [records, users]);

  const isLoading = recordsLoading || isLoadingUsers;

  if (isLoading) {
    return (
      <AppLayout title="Analytics">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Status Distribution */}
        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Records by Expected Time */}
        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Records by Expected Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={recordsByTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Trends */}
        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="hsl(262, 83%, 58%)" strokeWidth={2} name="Created" />
                  <Line type="monotone" dataKey="completed" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="breached" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Breached" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Comparison */}
        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {userComparison.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No user data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="hsl(142, 76%, 36%)" name="Completed" />
                    <Bar dataKey="breached" stackId="a" fill="hsl(0, 84%, 60%)" name="Breached" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
