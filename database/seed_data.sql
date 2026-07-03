-- Safely clear tables to allow re-running the seed script
TRUNCATE reviews, wallet_transactions, orders, messages, rental_details, listings, users RESTART IDENTITY CASCADE;

-- 1. DEMO USERS
INSERT INTO users (full_name, email, phone, password_hash, trust_score, id_verified) VALUES
('Ama Boateng', 'ama@nearbuy.com', '+233244111222', 'dummy_hash_1', 92, TRUE),
('Kwame Asante', 'kwame@nearbuy.com', '+233200333444', 'dummy_hash_2', 100, TRUE),
('SparkleCo Cleaning', 'hello@sparkleco.com', '+233555666777', 'dummy_hash_3', 85, FALSE),
('Mensah Rentals', 'info@mensahrentals.com', '+233277888999', 'dummy_hash_4', 98, TRUE);

-- 2. 10+ LISTINGS (Mix of Shop, Services, Rent with GHS pricing)
INSERT INTO listings (user_id, type, title, description, price, status, views) VALUES
(1, 'GOOD', 'iPhone 13 Pro - 128GB', 'Clean UK used iPhone 13 Pro. Battery health 88%. Comes with a free clear case.', 8500.00, 'ACTIVE', 45),
(2, 'RENTAL', 'Heavy Duty 5kVA Generator', 'Reliable power backup for events or construction sites. Fueled and ready. Daily pricing applies.', 450.00, 'ACTIVE', 89),
(3, 'SERVICE', 'Deep Home Cleaning', 'Full house deep cleaning service including sofa washing and window detailing.', 350.00, 'ACTIVE', 120),
(4, 'RENTAL', 'Sony A7III Camera + Lens', 'Perfect for weekend shoots. Comes with 2 batteries and a 64GB SD card.', 200.00, 'ACTIVE', 56),
(1, 'GOOD', 'Nike Air Force 1 (Size 43)', 'Brand new in box. Authentic, bought from the UK.', 1200.00, 'ACTIVE', 12),
(2, 'GOOD', 'Fresh Ghana Yam (10 Tubers)', 'Organic sweet white yams direct from the farm.', 250.00, 'ACTIVE', 30),
(3, 'SERVICE', 'Professional AC Repair', 'Gas top-ups, deep cleaning, and electrical fault resolutions.', 150.00, 'ACTIVE', 15),
(4, 'RENTAL', 'PS5 Console + 2 Controllers', 'Rent a PlayStation 5 for the weekend. Comes with FIFA 24 and Spider-Man 2.', 180.00, 'ACTIVE', 200),
(1, 'SERVICE', 'Graphic Design & Logo Creation', 'Professional branding for your new startup. Fast delivery.', 500.00, 'ACTIVE', 8),
(2, 'GOOD', 'MacBook M1 Pro (16GB RAM)', 'Space gray, barely used. Cycle count is under 50.', 12500.00, 'ACTIVE', 75);

-- 3. RENTAL DETAILS (Required for RENTAL types)
INSERT INTO rental_details (listing_id, deposit_amount, min_duration, max_duration) VALUES
(2, 500.00, 1, 7),  -- Generator
(4, 1000.00, 1, 3), -- Camera
(8, 300.00, 1, 2);  -- PS5

-- 4. SAMPLE MESSAGES (Lively chat threads)
INSERT INTO messages (listing_id, sender_id, receiver_id, body) VALUES
(1, 2, 1, 'Hello Ama, is the iPhone still available? Could you do GHS 8,000?'),
(1, 1, 2, 'Hi Kwame! Yes it is. Lowest I can do is GHS 8,300.'),
(2, 3, 2, 'Good morning Mr. Asante, I want to rent your generator for a site this weekend.'),
(3, 1, 3, 'Can you come to East Legon this Saturday for a 3-bedroom deep clean?');

-- 5. ORDERS & ESCROW
INSERT INTO orders (listing_id, buyer_id, seller_id, amount, status, escrow_amount, paid_at) VALUES
(1, 2, 1, 8300.00, 'PAID', 8300.00, CURRENT_TIMESTAMP),
(3, 1, 3, 350.00, 'COMPLETED', 0.00, CURRENT_TIMESTAMP - INTERVAL '2 days');

-- 6. WALLET TRANSACTIONS (+GHS 500 top-up, −GHS 120 AC repair escrow, etc.)
INSERT INTO wallet_transactions (user_id, type, amount, reference, balance_after) VALUES
(2, 'CREDIT', 500.00, 'TXN-MOMO-1001', 500.00),
(1, 'DEBIT', 120.00, 'TXN-ESCROW-2001', 380.00),
(3, 'DEBIT', 500.00, 'TXN-DEP-3001', 0.00);

-- 7. REVIEWS
INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, body, verified) VALUES
(2, 1, 3, 5, 'SparkleCo did an amazing job! The house looks brand new.', TRUE);
