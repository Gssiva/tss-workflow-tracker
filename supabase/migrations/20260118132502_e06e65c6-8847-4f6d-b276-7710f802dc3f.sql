-- Update daily_work_uploads policy to include super_admin
DROP POLICY IF EXISTS "Users can view own uploads and mentions" ON daily_work_uploads;
CREATE POLICY "Users can view own uploads and mentions" ON daily_work_uploads
FOR SELECT USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY (mentioned_users) 
  OR is_any_admin(auth.uid())
);

-- Add delete policy for admins on daily_work_uploads
CREATE POLICY "Admins can delete any uploads" ON daily_work_uploads
FOR DELETE USING (is_any_admin(auth.uid()));

-- Update invitations policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations for their email" ON invitations;

CREATE POLICY "Admins can view all invitations" ON invitations
FOR SELECT USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can create invitations" ON invitations
FOR INSERT WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete invitations" ON invitations
FOR DELETE USING (is_any_admin(auth.uid()));

CREATE POLICY "Users can view invitations for their email" ON invitations
FOR SELECT USING (email = (auth.jwt() ->> 'email'::text));

-- Update profiles policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (is_any_admin(auth.uid()));

-- Allow super_admin to update any profile
CREATE POLICY "Super admin can update any profile" ON profiles
FOR UPDATE USING (is_super_admin(auth.uid()));

-- Update records policies to include super_admin
DROP POLICY IF EXISTS "Admins can view all records" ON records;
DROP POLICY IF EXISTS "Admins can update any record" ON records;
DROP POLICY IF EXISTS "Admins can create records for any user" ON records;

CREATE POLICY "Admins can view all records" ON records
FOR SELECT USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update any record" ON records
FOR UPDATE USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can create records for any user" ON records
FOR INSERT WITH CHECK (is_any_admin(auth.uid()));

-- Add delete policy for super_admin on records
CREATE POLICY "Super admin can delete any record" ON records
FOR DELETE USING (is_super_admin(auth.uid()));

-- Update students table policies for full super_admin access
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

CREATE POLICY "Admins can view all students" ON students
FOR SELECT USING (is_any_admin(auth.uid()));

CREATE POLICY "Admins can insert students" ON students
FOR INSERT WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Super admin can update students" ON students
FOR UPDATE USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin can delete students" ON students
FOR DELETE USING (is_super_admin(auth.uid()));

-- Update user_roles policies for super_admin full access
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Users can view their own role" ON user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON user_roles
FOR SELECT USING (is_any_admin(auth.uid()));

CREATE POLICY "Super admin can insert roles" ON user_roles
FOR INSERT WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admin can update roles" ON user_roles
FOR UPDATE USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin can delete roles" ON user_roles
FOR DELETE USING (is_super_admin(auth.uid()));