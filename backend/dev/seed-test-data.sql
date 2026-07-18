\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
    full_name, email, phone, password_hash, trust_score, id_verified,
    otp_code, otp_expiry, created_at
)
VALUES
    ('Ama Buyer', 'buyer@nearbuy.test', '+233200000001', crypt('Nearbuy123!', gen_salt('bf', 10)), 92, TRUE, NULL, NULL, NOW() - INTERVAL '90 days'),
    ('Kojo Seller', 'seller@nearbuy.test', '+233200000002', crypt('Nearbuy123!', gen_salt('bf', 10)), 97, TRUE, NULL, NULL, NOW() - INTERVAL '180 days'),
    ('Esi Rentals', 'rentals@nearbuy.test', '+233200000003', crypt('Nearbuy123!', gen_salt('bf', 10)), 88, TRUE, NULL, NULL, NOW() - INTERVAL '120 days')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash,
    trust_score = EXCLUDED.trust_score,
    id_verified = TRUE,
    otp_code = NULL,
    otp_expiry = NULL;

CREATE TEMP TABLE nearbuy_mock_users AS
SELECT
    CASE email
        WHEN 'buyer@nearbuy.test' THEN 'buyer'
        WHEN 'seller@nearbuy.test' THEN 'seller'
        WHEN 'rentals@nearbuy.test' THEN 'rentals'
    END AS role,
    id
FROM users
WHERE email IN ('buyer@nearbuy.test', 'seller@nearbuy.test', 'rentals@nearbuy.test');

-- Reset only data owned by the mock accounts, leaving normal local accounts intact.
DELETE FROM reviews
WHERE reviewer_id IN (SELECT id FROM nearbuy_mock_users)
   OR reviewed_user_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM wallet_transactions
WHERE user_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM orders
WHERE buyer_id IN (SELECT id FROM nearbuy_mock_users)
   OR seller_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM payment_methods
WHERE user_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM messages
WHERE sender_id IN (SELECT id FROM nearbuy_mock_users)
   OR receiver_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM notifications
WHERE user_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM push_tokens
WHERE user_id IN (SELECT id FROM nearbuy_mock_users);

DELETE FROM listing_images
WHERE listing_id IN (
    SELECT id FROM listings WHERE seller_id IN (SELECT id FROM nearbuy_mock_users)
);

DELETE FROM listings
WHERE seller_id IN (SELECT id FROM nearbuy_mock_users);

INSERT INTO listings (
    id, seller_id, title, description, type, price, status,
    view_count, chat_count, created_at
)
VALUES
    (91001, (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     'Sony WH-1000XM4 Headphones', 'Clean noise-cancelling headphones with case and charging cable.',
     'GOOD', 250.00, 'ACTIVE', 34, 5, NOW() - INTERVAL '8 days'),
    (91002, (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     'Logo and Brand Design', 'Logo package with three concepts, revisions, and export files.',
     'SERVICE', 150.00, 'ACTIVE', 21, 3, NOW() - INTERVAL '5 days'),
    (91003, (SELECT id FROM nearbuy_mock_users WHERE role = 'rentals'),
     'Canon Camera Weekend Rental', 'Canon DSLR, kit lens, battery, charger, and carry bag.',
     'RENTAL', 80.00, 'ACTIVE', 47, 8, NOW() - INTERVAL '12 days'),
    (91004, (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     'Study Desk Lamp', 'Adjustable LED desk lamp with three brightness levels.',
     'GOOD', 120.00, 'SOLD', 29, 4, NOW() - INTERVAL '25 days');

INSERT INTO listing_images (listing_id, image_url, position)
VALUES
    (91001, 'https://picsum.photos/seed/nearbuy-headphones/900/700', 0),
    (91002, 'https://picsum.photos/seed/nearbuy-design/900/700', 0),
    (91003, 'https://picsum.photos/seed/nearbuy-camera/900/700', 0),
    (91004, 'https://picsum.photos/seed/nearbuy-lamp/900/700', 0);

-- 92001 can be paid; 92002 can be completed; 92003 can be reviewed.
INSERT INTO orders (
    id, listing_id, buyer_id, seller_id, amount, item_amount,
    service_fee, status, created_at, payment_provider, payment_reference
)
VALUES
    (92001, 91001,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     253.75, 250.00, 3.75, 'PENDING', NOW() - INTERVAL '2 hours', NULL, NULL),
    (92002, 91002,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     152.25, 150.00, 2.25, 'PAID', NOW() - INTERVAL '1 day', 'SANDBOX', 'MOCK-ESCROW-92002'),
    (92003, 91003,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'rentals'),
     82.00, 80.00, 2.00, 'COMPLETED', NOW() - INTERVAL '14 days', 'SANDBOX', 'MOCK-COMPLETE-92003'),
    (92004, 91004,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     122.00, 120.00, 2.00, 'COMPLETED', NOW() - INTERVAL '21 days', 'SANDBOX', 'MOCK-REVIEWED-92004');

INSERT INTO wallet_transactions (
    id, user_id, order_id, type, amount, description, created_at
)
VALUES
    (93001, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), NULL,
     'CREDIT', 300.00, 'Sandbox Mobile Money top-up', NOW() - INTERVAL '30 days'),
    (93002, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92002,
     'CREDIT', 152.25, 'External payment for order #92002', NOW() - INTERVAL '1 day'),
    (93003, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92002,
     'ESCROW_HOLD', 152.25, 'Escrow hold for order #92002', NOW() - INTERVAL '1 day' + INTERVAL '1 minute'),
    (93004, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92003,
     'CREDIT', 82.00, 'External payment for order #92003', NOW() - INTERVAL '15 days'),
    (93005, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92003,
     'ESCROW_HOLD', 82.00, 'Escrow hold for order #92003', NOW() - INTERVAL '15 days' + INTERVAL '1 minute'),
    (93006, (SELECT id FROM nearbuy_mock_users WHERE role = 'rentals'), 92003,
     'ESCROW_RELEASE', 80.00, 'Escrow release for order #92003', NOW() - INTERVAL '14 days'),
    (93007, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92004,
     'CREDIT', 122.00, 'External payment for order #92004', NOW() - INTERVAL '22 days'),
    (93008, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'), 92004,
     'ESCROW_HOLD', 122.00, 'Escrow hold for order #92004', NOW() - INTERVAL '22 days' + INTERVAL '1 minute'),
    (93009, (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'), 92004,
     'ESCROW_RELEASE', 120.00, 'Escrow release for order #92004', NOW() - INTERVAL '21 days');

INSERT INTO payment_methods (
    id, user_id, type, provider, last_four, is_default, created_at
)
VALUES
    (94001, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     'MOBILE_MONEY', 'MTN', '0001', TRUE, NOW() - INTERVAL '40 days');

INSERT INTO reviews (
    id, order_id, listing_id, reviewer_id, reviewed_user_id,
    rating, comment, created_at
)
VALUES
    (95001, 92004, 91004,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     5, 'Exactly as described and pickup was easy.', NOW() - INTERVAL '20 days');

INSERT INTO messages (
    id, listing_id, sender_id, receiver_id, content, is_read, created_at
)
VALUES
    (96001, 91001,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     'Hi, are the headphones still available?', TRUE, NOW() - INTERVAL '3 hours'),
    (96002, 91001,
     (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     'Yes, they are. You can test them before pickup.', FALSE, NOW() - INTERVAL '2 hours 50 minutes');

INSERT INTO notifications (
    id, user_id, title, body, route, is_read, created_at
)
VALUES
    (97001, (SELECT id FROM nearbuy_mock_users WHERE role = 'buyer'),
     'Test data ready', 'Order NB-92001 is ready for sandbox payment.', '/orders', FALSE, NOW()),
    (97002, (SELECT id FROM nearbuy_mock_users WHERE role = 'seller'),
     'Payment secured', 'Order NB-92002 is held in escrow.', '/orders', FALSE, NOW() - INTERVAL '1 day');

SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('listings', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM listings), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('orders', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM orders), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('wallet_transactions', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM wallet_transactions), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('payment_methods', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM payment_methods), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('reviews', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM reviews), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('messages', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM messages), 1), 1), TRUE);
SELECT setval(pg_get_serial_sequence('notifications', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM notifications), 1), 1), TRUE);

COMMIT;

SELECT 'Nearbuy mock data seeded successfully.' AS result;
SELECT email, full_name, trust_score, id_verified
FROM users
WHERE email IN ('buyer@nearbuy.test', 'seller@nearbuy.test', 'rentals@nearbuy.test')
ORDER BY email;
SELECT id, listing_id, status, amount, payment_provider
FROM orders
WHERE id BETWEEN 92001 AND 92004
ORDER BY id;
