-- MODULAR SCHEMA: Core Tables for Solve Print

-- 1. Profiles: User identities and custom roles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'developer')),
    vpa TEXT, -- UPI ID for developer/owner
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pricing Config: Owner-defined ₹ rates
CREATE TABLE IF NOT EXISTS public.pricing_config (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id),
    page_type TEXT NOT NULL DEFAULT 'A4', 
    print_type TEXT NOT NULL DEFAULT 'BW', 
    rate_per_page DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders: Main queue management
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles(id),
    pickup_code TEXT NOT NULL, -- 3-digit code
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('pending_payment', 'queued', 'printing', 'ready', 'completed')),
    total_pages INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    transaction_id TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Documents: File metadata and AI inspection results
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    page_count INTEGER DEFAULT 0,
    is_color BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
