-- Ensure Realtime is enabled for required tables
-- This adds orders and shop_settings to the supabase_realtime publication
-- so that postgres_changes listeners can receive events

-- First, check and add orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;

-- Then, check and add shop_settings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'shop_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings;
    END IF;
END $$;

-- Also ensure shop_settings has FULL replica identity for proper updates
ALTER TABLE shop_settings REPLICA IDENTITY FULL;
