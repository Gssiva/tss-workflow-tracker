-- Add file_url column to records table for document attachments
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Create storage bucket for record documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('record-documents', 'record-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for record documents
CREATE POLICY "Users can upload their own record documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'record-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view record documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'record-documents');

CREATE POLICY "Users can update their own record documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'record-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own record documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'record-documents' 
  AND auth.uid() IS NOT NULL
);