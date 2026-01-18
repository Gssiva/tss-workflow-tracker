import { useState } from 'react';
import { Camera, Clock, CheckCircle2, AlertTriangle, FileText, Calendar } from 'lucide-react';
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

export default function StudentDashboard() {
  const { 
    currentStudent, 
    studentUploads, 
    tests, 
    testAssignments,
    isLoadingCurrentStudent 
  } = useStudents();
  const [uploadType, setUploadType] = useState<'morning' | 'evening'>('morning');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Check today's uploads
  const todayUploads = studentUploads.filter(u => isToday(new Date(u.upload_date)));
  const hasMorningUpload = todayUploads.some(u => u.upload_type === 'morning');
  const hasEveningUpload = todayUploads.some(u => u.upload_type === 'evening');

  // Calculate stats
  const totalUploads = studentUploads.length;
  const completedTests = testAssignments.filter(a => a.status === 'completed').length;
  const pendingTests = testAssignments.filter(a => a.status === 'pending').length;
  const upcomingTests = tests.filter(t => new Date(t.test_date) >= new Date()).slice(0, 3);

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
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Student Profile Not Found</h2>
            <p className="text-muted-foreground">Please contact admin to set up your student profile.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const handleUploadClick = (type: 'morning' | 'evening') => {
    setUploadType(type);
    setShowUploadDialog(true);
  };

  return (
    <AppLayout title="Student Dashboard">
      <div className="space-y-8">
        {/* Issue Notifications */}
        <IssueNotifications />

        {/* Welcome Section */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome, {currentStudent.profile?.full_name || 'Student'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Student ID: {currentStudent.student_id} | Batch: {currentStudent.batch || 'N/A'} | Course: {currentStudent.course || 'N/A'}
          </p>
        </div>

        {/* Daily Upload Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={`border-2 ${hasMorningUpload ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Morning Upload
              </CardTitle>
              <CardDescription>Upload your morning task image</CardDescription>
            </CardHeader>
            <CardContent>
              {hasMorningUpload ? (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Completed for today</span>
                </div>
              ) : (
                <Button onClick={() => handleUploadClick('morning')} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Morning Task
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={`border-2 ${hasEveningUpload ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Evening Upload
              </CardTitle>
              <CardDescription>Upload your evening task image</CardDescription>
            </CardHeader>
            <CardContent>
              {hasEveningUpload ? (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Completed for today</span>
                </div>
              ) : (
                <Button onClick={() => handleUploadClick('evening')} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Evening Task
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUploads}</p>
                  <p className="text-sm text-muted-foreground">Total Uploads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedTests}</p>
                  <p className="text-sm text-muted-foreground">Tests Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTests}</p>
                  <p className="text-sm text-muted-foreground">Pending Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tests */}
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
              <div className="space-y-3">
                {upcomingTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{test.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(test.test_date), 'PPP')} | Duration: {test.duration_minutes || 'N/A'} mins
                      </p>
                    </div>
                    <Badge variant="secondary">{test.max_marks || 'N/A'} marks</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {studentUploads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No uploads yet</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentUploads.slice(0, 6).map((upload) => (
                  <Card key={upload.id} className="overflow-hidden">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StudentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        uploadType={uploadType}
      />

      <TeamChatbox />
    </AppLayout>
  );
}
