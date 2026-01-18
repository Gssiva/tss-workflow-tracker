-- Allow anyone to validate API keys (read-only access to check if key is valid)
CREATE POLICY "Anyone can validate API keys"
  ON public.student_api_keys
  FOR SELECT
  USING (true);

-- Drop the admin-only select policy since we now have a more permissive one
DROP POLICY IF EXISTS "Admins can view API keys" ON public.student_api_keys;

-- Update RLS policy for students table to allow self-insert for new students
CREATE POLICY "Users can insert their own student profile"
  ON public.students
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policy for students to allow students to view their own profile
CREATE POLICY "Students can view their own profile"
  ON public.students
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_any_admin(auth.uid()));