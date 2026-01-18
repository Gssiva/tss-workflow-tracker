-- Fix public storage buckets security issue
-- Make daily-work-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'daily-work-images';

-- Make student-uploads bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'student-uploads';

-- Remove the public SELECT policy for daily-work-images
DROP POLICY IF EXISTS "Anyone can view work images" ON storage.objects;

-- Remove the public SELECT policy for student-uploads
DROP POLICY IF EXISTS "Student uploads are publicly accessible" ON storage.objects;

-- Add authenticated users can view daily-work-images (employees/admins)
CREATE POLICY "Authenticated users can view work images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'daily-work-images' 
  AND auth.role() = 'authenticated'
);