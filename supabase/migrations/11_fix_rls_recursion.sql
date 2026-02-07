-- FIX: Infinite Recursion in RLS Policies

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;

-- 2. Create a security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policies correctly
-- Users can always see their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Owners and Developers can see all profiles (using the safe function)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  get_my_role() IN ('owner', 'developer')
);

-- Note: Inserting into profiles is handled by the auth trigger we set up earlier,
-- but let's ensure basic insert/update policies exist if needed.
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
