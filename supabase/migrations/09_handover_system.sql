-- HANDOVER VERIFICATION RPC

CREATE OR REPLACE FUNCTION public.verify_pickup_code(
    p_pickup_code TEXT,
    p_status_filter TEXT DEFAULT 'ready'
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    order_id UUID
) AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- Look for a paid order that is 'ready' with the matching code
    SELECT id INTO v_order_id
    FROM public.orders
    WHERE pickup_code = p_pickup_code
    AND status = p_status_filter
    AND payment_status = 'paid'
    LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        -- Update order to completed
        UPDATE public.orders
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_order_id;

        RETURN QUERY SELECT TRUE, 'Handover successful!'::TEXT, v_order_id;
    ELSE
        RETURN QUERY SELECT FALSE, 'Invalid code or order not ready.'::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
