-- Analytics Persistence System
-- Preserves analytics data even after orders are deleted

-- Create analytics snapshot table
CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_pages INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);

-- Function to snapshot order data before deletion
CREATE OR REPLACE FUNCTION snapshot_order_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only snapshot if order was completed
    IF OLD.status IN ('handed_over', 'completed', 'ready') THEN
        INSERT INTO analytics_daily (date, total_orders, total_revenue, total_pages)
        VALUES (DATE(OLD.created_at), 1, OLD.estimated_cost, OLD.total_pages)
        ON CONFLICT (date) 
        DO UPDATE SET 
            total_orders = analytics_daily.total_orders + 1,
            total_revenue = analytics_daily.total_revenue + OLD.estimated_cost,
            total_pages = analytics_daily.total_pages + OLD.total_pages,
            updated_at = NOW();
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before order deletion
DROP TRIGGER IF EXISTS before_order_delete ON orders;
CREATE TRIGGER before_order_delete
    BEFORE DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION snapshot_order_analytics();

-- Updated analytics RPC that combines live + archived data
CREATE OR REPLACE FUNCTION public.get_analytics_stats()
RETURNS TABLE (
    today_revenue DECIMAL,
    today_orders BIGINT,
    today_pages BIGINT,
    weekly_revenue DECIMAL,
    queue_value DECIMAL,
    in_progress_count BIGINT
) AS $$
DECLARE
    archived_today_revenue DECIMAL := 0;
    archived_today_orders BIGINT := 0;
    archived_today_pages BIGINT := 0;
    archived_weekly_revenue DECIMAL := 0;
BEGIN
    -- Get archived data for today
    SELECT COALESCE(ad.total_revenue, 0), COALESCE(ad.total_orders, 0), COALESCE(ad.total_pages, 0)
    INTO archived_today_revenue, archived_today_orders, archived_today_pages
    FROM analytics_daily ad
    WHERE ad.date = CURRENT_DATE;

    -- Get archived weekly data
    SELECT COALESCE(SUM(ad.total_revenue), 0)
    INTO archived_weekly_revenue
    FROM analytics_daily ad
    WHERE ad.date >= CURRENT_DATE - INTERVAL '7 days';

    RETURN QUERY
    SELECT
        -- Today's revenue: live orders + archived
        COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE AND o.status IN ('handed_over', 'completed', 'ready') 
            THEN o.estimated_cost ELSE 0 END), 0) + archived_today_revenue AS today_revenue,
        
        -- Today's orders: live + archived
        COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE AND o.status IN ('handed_over', 'completed', 'ready') 
            THEN 1 END) + archived_today_orders AS today_orders,
        
        -- Today's pages: live + archived
        COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE AND o.status IN ('handed_over', 'completed', 'ready') 
            THEN o.total_pages ELSE 0 END), 0) + archived_today_pages AS today_pages,
        
        -- Weekly revenue: live + archived
        COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '7 days' AND o.status IN ('handed_over', 'completed', 'ready') 
            THEN o.estimated_cost ELSE 0 END), 0) + archived_weekly_revenue AS weekly_revenue,
        
        -- Queue value (only live pending orders)
        COALESCE(SUM(CASE WHEN o.status IN ('queued', 'printing', 'ready', 'pending_verification') 
            THEN o.estimated_cost ELSE 0 END), 0) AS queue_value,
        
        -- In progress count (only live)
        COUNT(CASE WHEN o.status IN ('printing', 'queued') THEN 1 END) AS in_progress_count
    FROM orders o;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_analytics_stats TO anon, authenticated;

COMMENT ON TABLE analytics_daily IS 'Stores aggregated analytics data that persists even after orders are deleted';
COMMENT ON FUNCTION snapshot_order_analytics IS 'Triggered before order deletion to preserve analytics data';
