import { useState } from 'react';
import { Camera, CheckCircle2, Calendar } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudents } from '@/hooks/useStudents';
import { StudentUploadDialog } from '@/components/student/StudentUploadDialog';
import { TeamChatbox } from '@/components/chat/TeamChatbox';

export default function StudentDayUpdate() {
  const { currentStudent, studentUploads, isLoadingCurrentStudent } = useStudents();
  const [uploadType, setUploadType] = useState<'morning' | 'evening'>('morning');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Check today's uploads
  const todayUploads = studentUploads.filter(u => isToday(new Date(u.upload_date)));
  const hasMorningUpload = todayUploads.some(u => u.upload_type === 'morning');
  const hasEveningUpload = todayUploads.some(u => u.upload_type === 'evening');

  if (isLoadingCurrentStudent) {
    return (
      <AppLayout title="Day Update">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleUploadClick = (type: 'morning' | 'evening') => {
    setUploadType(type);
    setShowUploadDialog(true);
  };

  return (
    <AppLayout title="Day Update">
      <div className="space-y-8">
        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Uploads - {format(new Date(), 'PPPP')}
            </CardTitle>
            <CardDescription>
              Upload your morning and evening task images daily
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Badge variant={hasMorningUpload ? "default" : "outline"} className="text-sm py-1 px-3">
                Morning: {hasMorningUpload ? '✓ Uploaded' : 'Pending'}
              </Badge>
              <Badge variant={hasEveningUpload ? "default" : "outline"} className="text-sm py-1 px-3">
                Evening: {hasEveningUpload ? '✓ Uploaded' : 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upload Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={`border-2 ${hasMorningUpload ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Morning Upload
              </CardTitle>
              <CardDescription>Upload your morning task image with description</CardDescription>
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
              <CardDescription>Upload your evening task image with description</CardDescription>
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

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
          </CardHeader>
          <CardContent>
            {studentUploads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No uploads yet</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {studentUploads.map((upload) => (
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
