DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE orders
            DROP CONSTRAINT IF EXISTS orders_status_check;

        ALTER TABLE orders
            ADD CONSTRAINT orders_status_check
            CHECK (status IN ('PENDING', 'PAID', 'REFUND_PENDING', 'REFUNDED', 'COMPLETED', 'CANCELLED'));
    END IF;
END
$$;
