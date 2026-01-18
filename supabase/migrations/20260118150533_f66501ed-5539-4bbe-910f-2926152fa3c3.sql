-- Create a table to store API keys for student access
CREATE TABLE IF NOT EXISTS public.student_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.student_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage API keys
CREATE POLICY "Admins can view API keys"
  ON public.student_api_keys
  FOR SELECT
  USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can manage API keys"
  ON public.student_api_keys
  FOR ALL
  USING (public.is_any_admin(auth.uid()));

-- Insert the default API key
INSERT INTO public.student_api_keys (api_key, description)
VALUES ('APIKEY-TSS-STUDENT-TRACKER-9f8a7b6c5d4e', 'Default student access key');

-- Add an is_profile_complete column to students table to track setup status
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN NOT NULL DEFAULT false;