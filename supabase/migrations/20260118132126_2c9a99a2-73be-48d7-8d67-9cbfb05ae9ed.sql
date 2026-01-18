-- Create storage bucket for student uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-uploads', 'student-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for student uploads bucket
CREATE POLICY "Students can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all student files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-uploads' 
  AND (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  )
);

CREATE POLICY "Student uploads are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-uploads');