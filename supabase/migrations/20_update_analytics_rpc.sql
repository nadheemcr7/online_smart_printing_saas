-- Final Revenue Persistence Fix
-- Combines current orders with archived revenue (from deleted orders)

CREATE OR REPLACE FUNCTION public.get_owner_analytics()
RETURNS TABLE (
    today_revenue DECIMAL,
    today_orders BIGINT,
    today_pages BIGINT,
    weekly_revenue DECIMAL,
    pending_revenue DECIMAL
) AS $$
DECLARE
    archived_today_rev DECIMAL := 0;
    archived_today_orders BIGINT := 0;
    archived_today_pages BIGINT := 0;
    archived_weekly_rev DECIMAL := 0;
BEGIN
    -- 1. Fetch archived stats from before records were deleted
    SELECT 
        COALESCE(SUM(total_revenue), 0), 
        COALESCE(SUM(total_orders), 0), 
        COALESCE(SUM(total_pages), 0)
    INTO archived_today_rev, archived_today_orders, archived_today_pages
    FROM public.analytics_daily
    WHERE date = CURRENT_DATE;

    SELECT COALESCE(SUM(total_revenue), 0)
    INTO archived_weekly_rev
    FROM public.analytics_daily
    WHERE date >= (CURRENT_DATE - INTERVAL '7 days');

    RETURN QUERY
    SELECT 
        -- Today's Revenue: Live (Today) + Archived (Today)
        (COALESCE(SUM(estimated_cost) FILTER (
            WHERE created_at >= CURRENT_DATE 
            AND (payment_status = 'paid' OR payment_verified = TRUE OR status IN ('queued', 'printing', 'ready', 'completed'))
        ), 0) + archived_today_rev)::DECIMAL AS today_revenue,
        
        -- Today's Orders: Live + Archived
        (COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) + archived_today_orders)::BIGINT AS today_orders,
        
        -- Today's Pages: Live + Archived
        (COALESCE(SUM(total_pages) FILTER (WHERE created_at >= CURRENT_DATE), 0) + archived_today_pages)::BIGINT AS today_pages,
        
        -- Weekly Revenue: Live + Archived
        (COALESCE(SUM(estimated_cost) FILTER (
            WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days') 
            AND (payment_status = 'paid' OR payment_verified = TRUE OR status IN ('queued', 'printing', 'ready', 'completed'))
        ), 0) + archived_weekly_rev)::DECIMAL AS weekly_revenue,
        
        -- Pending Value: Only live orders that still need work/money
        COALESCE(SUM(estimated_cost) FILTER (
            WHERE status != 'completed' 
            AND (payment_status = 'paid' OR payment_verified = TRUE OR status IN ('queued', 'printing', 'ready'))
        ), 0)::DECIMAL AS pending_revenue
    FROM public.orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
