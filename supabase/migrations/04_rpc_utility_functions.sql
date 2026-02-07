-- MODULAR SCHEMA: RPC & Utility Functions

-- RPC: Batch Update Order Status
-- Purpose: Allows the Shop Owner to select multiple order IDs and change their status 
-- (e.g., Queued -> Printing) in a single API call for maximum efficiency during rushes.
CREATE OR REPLACE FUNCTION batch_update_order_status(order_ids UUID[], new_status TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.orders
    SET status = new_status
    WHERE id = ANY(order_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get Queue Stats
-- Purpose: Provides the Shop Owner with a quick summary of current pending prints.
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT o.status, COUNT(*)
    FROM public.orders o
    GROUP BY o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
