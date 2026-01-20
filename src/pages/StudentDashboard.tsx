import { useState, useEffect } from 'react';
import { Camera, Clock, CheckCircle2, AlertTriangle, FileText, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudents } from '@/hooks/useStudents';
import { StudentUploadDialog } from '@/components/student/StudentUploadDialog';
import { IssueNotifications } from '@/components/dashboard/IssueNotifications';
import { TeamChatbox } from '@/components/chat/TeamChatbox';
import { format, isToday } from 'date-fns';
import { motion, Variants } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Submission {
  _id: string;
  studentId: string;
  taskName?: string;
  title?: string;
  description?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: string;
  marks?: number;
  feedback?: string;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { 
    currentStudent, 
    studentUploads, 
    tests, 
    testAssignments,
    isLoadingCurrentStudent 
  } = useStudents();
  const [uploadType, setUploadType] = useState<'morning' | 'evening'>('morning');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Fetch submissions from external API
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!currentStudent?.student_id) return;
      
      try {
        setLoadingSubmissions(true);
        const response = await fetch('https://tssplatform.onrender.com/getSubmissionByStudent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId: currentStudent.student_id }),
        });

        if (response.ok) {
          const data = await response.json();
          setSubmissions(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    if (currentStudent) {
      fetchSubmissions();
    }
  }, [currentStudent]);

  // Check today's uploads
  const todayUploads = studentUploads.filter(u => isToday(new Date(u.upload_date)));
  const hasMorningUpload = todayUploads.some(u => u.upload_type === 'morning');
  const hasEveningUpload = todayUploads.some(u => u.upload_type === 'evening');

  // Calculate stats
  const totalUploads = studentUploads.length;
  const completedTests = testAssignments.filter(a => a.status === 'completed').length;
  const pendingTests = testAssignments.filter(a => a.status === 'pending').length;
  const upcomingTests = tests.filter(t => new Date(t.test_date) >= new Date()).slice(0, 3);
  const totalSubmissions = submissions.length;
  const completedSubmissions = submissions.filter(s => s.status === 'completed' || s.status === 'approved').length;

  if (isLoadingCurrentStudent) {
    return (
      <AppLayout title="Student Dashboard">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!currentStudent) {
    return (
      <AppLayout title="Student Dashboard">
        <motion.div initial="hidden" animate="visible" variants={scaleIn}>
          <Card>
            <CardContent className="py-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Student Profile Not Found</h2>
              <p className="text-muted-foreground">Please contact admin to set up your student profile.</p>
            </CardContent>
          </Card>
        </motion.div>
      </AppLayout>
    );
  }

  const handleUploadClick = (type: 'morning' | 'evening') => {
    setUploadType(type);
    setShowUploadDialog(true);
  };

  return (
    <AppLayout title="Student Dashboard">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-8"
      >
        {/* Issue Notifications */}
        <IssueNotifications />

        {/* Welcome Section */}
        <motion.div variants={fadeInUp} className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome, {currentStudent.profile?.full_name || 'Student'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Student ID: {currentStudent.student_id} | Batch: {currentStudent.batch || 'N/A'} | Course: {currentStudent.course || 'N/A'}
          </p>
        </motion.div>

        {/* Daily Upload Cards */}
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`border-2 h-full ${hasMorningUpload ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Morning Upload
                </CardTitle>
                <CardDescription>Upload your morning task image</CardDescription>
              </CardHeader>
              <CardContent>
                {hasMorningUpload ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-success"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Completed for today</span>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => handleUploadClick('morning')} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Morning Task
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className={`border-2 h-full ${hasEveningUpload ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Evening Upload
                </CardTitle>
                <CardDescription>Upload your evening task image</CardDescription>
              </CardHeader>
              <CardContent>
                {hasEveningUpload ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-success"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Completed for today</span>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => handleUploadClick('evening')} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Evening Task
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-4">
          {[
            { icon: FileText, value: totalUploads, label: 'Total Uploads', color: 'primary' },
            { icon: CheckCircle2, value: completedTests, label: 'Tests Completed', color: 'success' },
            { icon: Clock, value: pendingTests, label: 'Pending Tests', color: 'warning' },
            { icon: BarChart3, value: totalSubmissions, label: 'Total Submissions', color: 'accent' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`p-3 rounded-full bg-${stat.color}/10`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Submissions Report */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Your Submissions Report
              </CardTitle>
              <CardDescription>
                Task submissions from TSS Platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-8 w-8 text-primary" />
                  </motion.div>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No submissions found</p>
              ) : (
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {submissions.slice(0, 10).map((submission, i) => (
                    <motion.div 
                      key={submission._id || i}
                      variants={fadeInUp}
                      whileHover={{ x: 5, backgroundColor: 'hsl(var(--muted)/0.5)' }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{submission.taskName || submission.title || 'Task Submission'}</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.submittedAt || submission.createdAt 
                            ? format(new Date(submission.submittedAt || submission.createdAt!), 'PPP')
                            : 'Date not available'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {submission.marks !== undefined && (
                          <Badge variant="outline" className="font-mono">
                            {submission.marks} marks
                          </Badge>
                        )}
                        <Badge 
                          variant={
                            submission.status === 'completed' || submission.status === 'approved' 
                              ? 'default' 
                              : submission.status === 'pending' 
                                ? 'secondary' 
                                : 'outline'
                          }
                        >
                          {submission.status || 'submitted'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Tests */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No upcoming tests</p>
              ) : (
                <motion.div 
                  variants={staggerContainer}
                  className="space-y-3"
                >
                  {upcomingTests.map((test, i) => (
                    <motion.div 
                      key={test.id} 
                      variants={fadeInUp}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(test.test_date), 'PPP')} | Duration: {test.duration_minutes || 'N/A'} mins
                        </p>
                      </div>
                      <Badge variant="secondary">{test.max_marks || 'N/A'} marks</Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Uploads */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {studentUploads.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No uploads yet</p>
              ) : (
                <motion.div 
                  variants={staggerContainer}
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {studentUploads.slice(0, 6).map((upload, i) => (
                    <motion.div
                      key={upload.id}
                      variants={scaleIn}
                      whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}
                    >
                      <Card className="overflow-hidden">
                        <img
                          src={upload.image_url}
                          alt={`${upload.upload_type} upload`}
                          className="w-full h-40 object-cover"
                        />
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={upload.upload_type === 'morning' ? 'default' : 'secondary'}>
                              {upload.upload_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(upload.upload_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {upload.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{upload.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <StudentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        uploadType={uploadType}
      />

      <TeamChatbox />
    </AppLayout>
  );
}
