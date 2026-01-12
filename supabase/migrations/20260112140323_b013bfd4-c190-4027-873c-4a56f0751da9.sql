-- Allow admins to insert records for any user
CREATE POLICY "Admins can create records for any user"
ON public.records
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));