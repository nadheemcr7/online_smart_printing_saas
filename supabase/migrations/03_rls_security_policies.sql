-- MODULAR SCHEMA: Row Level Security (RLS) Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles access
-- Customers can only see their own. Owners and Developers can see everyone.
CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'developer'))
);

-- 2. Pricing access
-- Everyone can READ prices to see how much their print will cost.
-- Only Owners and Developers can UPDATE or INSERT new rates.
CREATE POLICY "Pricing read access" ON public.pricing_config FOR SELECT USING (true);
CREATE POLICY "Pricing management access" ON public.pricing_config FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'developer'))
);

-- 3. Orders access
-- Customers can only see and manage their own orders.
-- Owners and Developers manage the entire queue.
CREATE POLICY "Orders access" ON public.orders FOR ALL USING (
    auth.uid() = customer_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'developer'))
);

-- 4. Documents access
-- Protects PDFs. Only the person who uploaded the file or the Shop Owner can view the file.
CREATE POLICY "Documents access" ON public.documents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'developer'))))
);
