DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(30);

        ALTER TABLE orders
            DROP CONSTRAINT IF EXISTS orders_payment_channel_check;

        ALTER TABLE orders
            ADD CONSTRAINT orders_payment_channel_check
            CHECK (payment_channel IS NULL OR payment_channel IN ('MOBILE_MONEY', 'CARD'));
    END IF;
END
$$;
