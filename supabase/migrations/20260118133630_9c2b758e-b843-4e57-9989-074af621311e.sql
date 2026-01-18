-- Create record_comments table for adding comments to records
CREATE TABLE public.record_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_issue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.record_comments ENABLE ROW LEVEL SECURITY;

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
ON public.record_comments
FOR SELECT
USING (is_any_admin(auth.uid()));

-- Users can view their own comments
CREATE POLICY "Users can view own comments"
ON public.record_comments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view issue comments on everyone's dashboard
CREATE POLICY "Users can view issue comments"
ON public.record_comments
FOR SELECT
USING (is_issue = true);

-- Admins can view all comments on their records
CREATE POLICY "Users can view comments on their records"
ON public.record_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM records r 
    WHERE r.id = record_comments.record_id 
    AND r.created_by = auth.uid()
  )
);

-- Users can create comments on their own records
CREATE POLICY "Users can create comments on own records"
ON public.record_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM records r 
    WHERE r.id = record_comments.record_id 
    AND r.created_by = auth.uid()
  )
);

-- Admins can create comments on any record
CREATE POLICY "Admins can create comments"
ON public.record_comments
FOR INSERT
WITH CHECK (is_any_admin(auth.uid()));

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.record_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
ON public.record_comments
FOR DELETE
USING (is_any_admin(auth.uid()));

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.record_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_record_comments_updated_at
BEFORE UPDATE ON public.record_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();