import { useState } from 'react';
import { Users, Trash2, Search, GraduationCap, Eye } from 'lucide-react';
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
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import { StudentUploadsViewDialog } from '@/components/admin/StudentUploadsViewDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, Variants } from 'framer-motion';

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

export default function AdminStudents() {
  const { role } = useAuth();
  const { students, isLoadingStudents, deleteStudent } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
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
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Student Management
            </h2>
            <p className="text-muted-foreground">
              View students and track their progress
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Users, value: students.length, label: 'Total Students', color: 'primary' },
            { icon: GraduationCap, value: new Set(students.map(s => s.batch).filter(Boolean)).size, label: 'Active Batches', color: 'success' },
            { icon: Users, value: new Set(students.map(s => s.course).filter(Boolean)).size, label: 'Courses', color: 'info' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card>
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

        {/* Search */}
        <motion.div variants={fadeInUp} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Students Table */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Students register through the TSS Platform
                  </p>
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
                    {filteredStudents.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
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
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewUploads(student.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            {isSuperAdmin && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(student.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <StudentUploadsViewDialog
        open={showUploadsDialog}
        onOpenChange={setShowUploadsDialog}
        studentId={selectedStudent}
      />
    </AppLayout>
  );
}
