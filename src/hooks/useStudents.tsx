import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Student = {
  id: string;
  user_id: string;
  student_id: string;
  batch: string | null;
  course: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    email: string;
    full_name: string | null;
  };
};

export type StudentDailyUpload = {
  id: string;
  student_id: string;
  upload_date: string;
  upload_type: 'morning' | 'evening';
  image_url: string;
  description: string | null;
  created_at: string;
};

export type StudentTest = {
  id: string;
  title: string;
  description: string | null;
  test_date: string;
  duration_minutes: number | null;
  max_marks: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type StudentTestAssignment = {
  id: string;
  test_id: string;
  student_id: string;
  marks_obtained: number | null;
  status: 'pending' | 'completed' | 'absent';
  completed_at: string | null;
  created_at: string;
};

export function useStudents() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = role === 'admin' || role === 'super_admin';

  // Fetch all students (admin only)
  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for students
      const userIds = students.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      return students.map(student => ({
        ...student,
        profile: profiles?.find(p => p.id === student.user_id),
      })) as Student[];
    },
    enabled: isAdmin,
  });

  // Fetch current student data (for student user)
  const currentStudentQuery = useQuery({
    queryKey: ['current-student'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Student | null;
    },
    enabled: role === 'student' && !!user,
  });

  // Fetch student daily uploads
  const studentUploadsQuery = useQuery({
    queryKey: ['student-uploads', currentStudentQuery.data?.id],
    queryFn: async () => {
      if (!currentStudentQuery.data) return [];
      const { data, error } = await supabase
        .from('student_daily_uploads')
        .select('*')
        .eq('student_id', currentStudentQuery.data.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data as StudentDailyUpload[];
    },
    enabled: !!currentStudentQuery.data,
  });

  // Fetch all student uploads (admin)
  const allStudentUploadsQuery = useQuery({
    queryKey: ['all-student-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_daily_uploads')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data as StudentDailyUpload[];
    },
    enabled: isAdmin,
  });

  // Fetch tests
  const testsQuery = useQuery({
    queryKey: ['student-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_tests')
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data as StudentTest[];
    },
    enabled: isAdmin || role === 'student',
  });

  // Fetch test assignments for current student
  const testAssignmentsQuery = useQuery({
    queryKey: ['test-assignments', currentStudentQuery.data?.id],
    queryFn: async () => {
      if (!currentStudentQuery.data) return [];
      const { data, error } = await supabase
        .from('student_test_assignments')
        .select('*')
        .eq('student_id', currentStudentQuery.data.id);

      if (error) throw error;
      return data as StudentTestAssignment[];
    },
    enabled: !!currentStudentQuery.data,
  });

  // Create student upload
  const createUpload = useMutation({
    mutationFn: async ({ 
      uploadType, 
      imageUrl, 
      description 
    }: { 
      uploadType: 'morning' | 'evening';
      imageUrl: string;
      description?: string;
    }) => {
      if (!currentStudentQuery.data) throw new Error('Student not found');

      const { data, error } = await supabase
        .from('student_daily_uploads')
        .insert({
          student_id: currentStudentQuery.data.id,
          upload_type: uploadType,
          image_url: imageUrl,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-uploads'] });
      toast.success('Upload successful!');
    },
    onError: (error: Error) => {
      toast.error('Upload failed: ' + error.message);
    },
  });

  // Create test (admin only)
  const createTest = useMutation({
    mutationFn: async (test: Omit<StudentTest, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('student_tests')
        .insert({
          ...test,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
      toast.success('Test created successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to create test: ' + error.message);
    },
  });

  // Delete student (super admin only)
  const deleteStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete student: ' + error.message);
    },
  });

  return {
    students: studentsQuery.data ?? [],
    currentStudent: currentStudentQuery.data,
    studentUploads: studentUploadsQuery.data ?? [],
    allStudentUploads: allStudentUploadsQuery.data ?? [],
    tests: testsQuery.data ?? [],
    testAssignments: testAssignmentsQuery.data ?? [],
    isLoadingStudents: studentsQuery.isLoading,
    isLoadingCurrentStudent: currentStudentQuery.isLoading,
    createUpload,
    createTest,
    deleteStudent,
  };
}
