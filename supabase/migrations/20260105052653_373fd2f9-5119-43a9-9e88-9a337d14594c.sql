-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create records table
CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expected_time_hours INTEGER NOT NULL CHECK (expected_time_hours IN (1, 2, 3, 5, 8)),
  breach_status BOOLEAN NOT NULL DEFAULT false,
  completed_status BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table for admin invite system
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to auto-calculate breach status
CREATE OR REPLACE FUNCTION public.check_breach_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If marked as completed, check if it breached the expected time
  IF NEW.completed_status = true AND NEW.completed_at IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at)) / 3600 > NEW.expected_time_hours THEN
      NEW.breach_status = true;
    END IF;
  -- If not completed and time has passed expected hours, mark as breached
  ELSIF NEW.completed_status = false THEN
    IF EXTRACT(EPOCH FROM (now() - NEW.created_at)) / 3600 > NEW.expected_time_hours THEN
      NEW.breach_status = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for breach status calculation
CREATE TRIGGER check_records_breach
  BEFORE INSERT OR UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.check_breach_status();

-- Create function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Check if user was invited and assign role accordingly
  SELECT * INTO invitation_record FROM public.invitations 
  WHERE email = NEW.email AND accepted_at IS NULL;
  
  IF FOUND THEN
    -- Mark invitation as accepted
    UPDATE public.invitations SET accepted_at = now() WHERE id = invitation_record.id;
    -- Assign user role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for records
CREATE POLICY "Users can view their own records"
  ON public.records FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all records"
  ON public.records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own records"
  ON public.records FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own records"
  ON public.records FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any record"
  ON public.records FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for invitations
CREATE POLICY "Admins can view all invitations"
  ON public.invitations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
  ON public.invitations FOR SELECT
  USING (true);