
-- Step 2: Create students table for additional student-specific data
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE,
  batch TEXT,
  course TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS policies for students table
CREATE POLICY "Admins can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view their own data"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Create student_daily_uploads table for morning/evening uploads
CREATE TABLE public.student_daily_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('morning', 'evening')),
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, upload_date, upload_type)
);

-- Enable RLS on student_daily_uploads
ALTER TABLE public.student_daily_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_daily_uploads
CREATE POLICY "Admins can view all student uploads"
ON public.student_daily_uploads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view their own uploads"
ON public.student_daily_uploads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_daily_uploads.student_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Students can create their own uploads"
ON public.student_daily_uploads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_daily_uploads.student_id
    AND s.user_id = auth.uid()
  )
);

-- Step 4: Create student_tests table
CREATE TABLE public.student_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  test_date DATE NOT NULL,
  duration_minutes INTEGER,
  max_marks INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on student_tests
ALTER TABLE public.student_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_tests
CREATE POLICY "Admins can manage all tests"
ON public.student_tests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view tests"
ON public.student_tests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- Step 5: Create student_test_assignments table
CREATE TABLE public.student_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.student_tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'absent')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_id, student_id)
);

-- Enable RLS on student_test_assignments
ALTER TABLE public.student_test_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_test_assignments
CREATE POLICY "Admins can manage all test assignments"
ON public.student_test_assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view their own test assignments"
ON public.student_test_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_test_assignments.student_id
    AND s.user_id = auth.uid()
  )
);

-- Step 6: Create student_weekly_reports table
CREATE TABLE public.student_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_uploads INTEGER DEFAULT 0,
  morning_uploads INTEGER DEFAULT 0,
  evening_uploads INTEGER DEFAULT 0,
  attendance_percentage DECIMAL(5,2) DEFAULT 0,
  remarks TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, week_start)
);

-- Enable RLS on student_weekly_reports
ALTER TABLE public.student_weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_weekly_reports
CREATE POLICY "Admins can manage all reports"
ON public.student_weekly_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Students can view their own reports"
ON public.student_weekly_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_weekly_reports.student_id
    AND s.user_id = auth.uid()
  )
);

-- Step 7: Create is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;

-- Step 8: Create function to check if user is any type of admin
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'super_admin'::app_role)
  )
$$;

-- Step 9: Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_daily_uploads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tests;

-- Step 10: Create updated_at triggers for new tables
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_tests_updated_at
  BEFORE UPDATE ON public.student_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
