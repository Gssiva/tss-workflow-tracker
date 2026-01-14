-- Create user activity logs table
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  page TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity logs
CREATE POLICY "Users can log their own activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id);