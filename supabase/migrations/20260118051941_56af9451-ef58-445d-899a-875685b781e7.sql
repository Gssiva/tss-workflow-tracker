
-- Step 1: Update the app_role enum to include 'super_admin' and 'student'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
