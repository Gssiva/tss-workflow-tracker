-- Create team_messages table for the chatspace
CREATE TABLE public.team_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for all authenticated users to view messages
CREATE POLICY "Authenticated users can view all messages"
ON public.team_messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create policy for users to create their own messages
CREATE POLICY "Users can create their own messages"
ON public.team_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.team_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;