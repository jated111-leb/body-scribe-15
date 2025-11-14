-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dietician', 'client');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create dietician_clients relationship table
CREATE TABLE public.dietician_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (dietician_id, client_id)
);

-- Enable RLS
ALTER TABLE public.dietician_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for dietician_clients
CREATE POLICY "Dieticians can view their clients"
  ON public.dietician_clients FOR SELECT
  TO authenticated
  USING (
    auth.uid() = dietician_id OR 
    auth.uid() = client_id
  );

CREATE POLICY "Dieticians can add clients"
  ON public.dietician_clients FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = dietician_id AND
    public.has_role(auth.uid(), 'dietician')
  );

CREATE POLICY "Dieticians can update their client relationships"
  ON public.dietician_clients FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = dietician_id AND
    public.has_role(auth.uid(), 'dietician')
  );

-- Update profiles to include role-related info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_selected BOOLEAN DEFAULT false;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dietician_clients_updated_at
  BEFORE UPDATE ON public.dietician_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();