-- MODULAR SCHEMA: Advanced Pricing & Shop Settings

-- 1. Create a table for Shop Settings
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_name TEXT DEFAULT 'RIDHA PRINTERS',
    is_open BOOLEAN DEFAULT TRUE,
    primary_vpa TEXT,
    backup_vpa TEXT,
    active_vpa_type TEXT DEFAULT 'primary' CHECK (active_vpa_type IN ('primary', 'backup')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Advanced Pricing Table (Tiered)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id),
    print_type TEXT NOT NULL, -- 'BW' or 'COLOR'
    side_type TEXT NOT NULL,  -- 'SINGLE' or 'DOUBLE'
    tier_limit INTEGER,       -- NULL means no limit (base rate)
    rate DECIMAL(10, 2) NOT NULL,
    priority INTEGER DEFAULT 1, -- To handle tiers (1: high, 2: low)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed initial data for RIDHA PRINTERS
-- Note: Replace OWNER_ID with the actual owner UUID when running or via code
-- B/W Single Side
INSERT INTO public.pricing_rules (print_type, side_type, tier_limit, rate, priority) VALUES 
('BW', 'SINGLE', 10, 2.00, 1),
('BW', 'SINGLE', NULL, 1.00, 2);

-- B/W Double Side
INSERT INTO public.pricing_rules (print_type, side_type, tier_limit, rate, priority) VALUES 
('BW', 'DOUBLE', 10, 2.00, 1),
('BW', 'DOUBLE', NULL, 1.50, 2);

-- Color
INSERT INTO public.pricing_rules (print_type, side_type, tier_limit, rate, priority) VALUES 
('COLOR', 'SINGLE', NULL, 10.00, 1),
('COLOR', 'DOUBLE', NULL, 20.00, 1);
