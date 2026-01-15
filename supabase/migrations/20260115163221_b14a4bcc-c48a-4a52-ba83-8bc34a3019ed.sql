-- Create storage bucket for daily work images
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-work-images', 'daily-work-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for daily work uploads
CREATE TABLE public.daily_work_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_work_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads and uploads where they are mentioned
CREATE POLICY "Users can view own uploads and mentions"
ON public.daily_work_uploads
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY(mentioned_users)
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Users can insert their own uploads
CREATE POLICY "Users can create own uploads"
ON public.daily_work_uploads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users can update own uploads"
ON public.daily_work_uploads
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON public.daily_work_uploads
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for daily work images
CREATE POLICY "Users can upload own work images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'daily-work-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view work images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'daily-work-images');

CREATE POLICY "Users can update own work images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'daily-work-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own work images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'daily-work-images' AND auth.uid()::text = (storage.foldername(name))[1]);