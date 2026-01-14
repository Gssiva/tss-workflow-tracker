-- Fix 1: Remove the overly permissive invitations policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a secure policy that allows viewing invitation only if the user's email matches
CREATE POLICY "Users can view invitations for their email"
  ON public.invitations FOR SELECT
  USING (
    email = (auth.jwt()->>'email')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix 2: Make the record-documents bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'record-documents';

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view record documents" ON storage.objects;

-- Create a secure SELECT policy that checks ownership
CREATE POLICY "Users can view their own record documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'record-documents'
  AND auth.uid() IS NOT NULL
  AND (
    -- Owner can view their own record documents
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.records WHERE created_by = auth.uid()
    )
    -- Or admin can view all
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);