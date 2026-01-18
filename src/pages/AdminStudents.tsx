import { useState } from 'react';
import { Users, Upload, Plus, Trash2, Search, GraduationCap, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { CreateStudentDialog } from '@/components/admin/CreateStudentDialog';
import { BulkStudentUploadDialog } from '@/components/admin/BulkStudentUploadDialog';
import { StudentUploadsViewDialog } from '@/components/admin/StudentUploadsViewDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminStudents() {
  const { role } = useAuth();
  const { students, isLoadingStudents, deleteStudent } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showUploadsDialog, setShowUploadsDialog] = useState(false);

  const isSuperAdmin = role === 'super_admin';

  const filteredStudents = students.filter(
    (student) =>
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (studentId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete students');
      return;
    }
    if (confirm('Are you sure you want to delete this student?')) {
      await deleteStudent.mutateAsync(studentId);
    }
  };

  const handleViewUploads = (studentId: string) => {
    setSelectedStudent(studentId);
    setShowUploadsDialog(true);
  };

  if (isLoadingStudents) {
    return (
      <AppLayout title="Students">
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Student Management
            </h2>
            <p className="text-muted-foreground">
              Manage students, view uploads, and track progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Register
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <GraduationCap className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(students.map(s => s.batch).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Batches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-info/10">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(students.map(s => s.course).filter(Boolean)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.profile?.full_name || 'N/A'}</TableCell>
                      <TableCell>{student.profile?.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.batch || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{student.course || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(student.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUploads(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateStudentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <BulkStudentUploadDialog open={showBulkUpload} onOpenChange={setShowBulkUpload} />
      <StudentUploadsViewDialog
        open={showUploadsDialog}
        onOpenChange={setShowUploadsDialog}
        studentId={selectedStudent}
      />
    </AppLayout>
  );
}
