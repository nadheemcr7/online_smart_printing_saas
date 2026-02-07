-- MODULAR SCHEMA: AI Payment Verification

-- 1. Adding payment verification fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS utr_id TEXT,
ADD COLUMN IF NOT EXISTS ai_verification_log JSONB;

-- 2. Update order status check to include verification steps
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending_payment', 'awaiting_verification', 'queued', 'printing', 'ready', 'completed'));

-- 3. Create a bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'payments', 
    'payments', 
    false, 
    5242880, -- 5MB limit per screenshot
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS for payments
CREATE POLICY "Users can upload payment screenshots" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'payments');

CREATE POLICY "Users and owners can view payment screenshots" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'payments' AND 
    (
        auth.uid() = owner OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'developer')
        )
    )
);
