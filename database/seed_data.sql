-- Sample users
INSERT INTO users (full_name, email, password_hash, phone, trust_score) VALUES
    ('Kofi Mensah',  'kofi@nearbuy.com',  'hashed123', '0244000001', 720),
    ('Ama Asante',   'ama@nearbuy.com',   'hashed123', '0244000002', 580),
    ('Kwame Darko',  'kwame@nearbuy.com', 'hashed123', '0244000003', 310);

-- Sample listings
INSERT INTO listings (user_id, type, title, description, price) VALUES
    (1, 'GOOD',    'Samsung Galaxy A54 — Like New',
                   '6 months old, no scratches, full box',       850.00),
    (1, 'SERVICE', 'Professional Graphic Design',
                   'Logo, flyer, and branding. 3-day delivery',  120.00),
    (2, 'RENTAL',  'Generator 3.5kVA — Daily Hire',
                   'Reliable, fuel not included',                  80.00),
    (2, 'GOOD',    'HP Laptop i5 8th Gen',
                   'Windows 11, 8GB RAM, 256GB SSD',            1200.00),
    (3, 'SERVICE', 'Home Plumbing Repair',
                   'Same-day service, all of Kumasi',              60.00),
    (3, 'RENTAL',  'DJ Sound System — Event Hire',
                   'Full PA system, weekend rates available',     200.00),
    (1, 'GOOD',    'Brand New Blender — Nunix',
                   'Still in box, unused',                         75.00),
    (2, 'SERVICE', 'Maths & Science Tutoring',
                   'SHS and JHS. Home visits available',           40.00),
    (3, 'RENTAL',  'Canon EOS Camera — Daily Hire',
                   'With 18-55mm lens and memory card',           100.00),
    (1, 'SERVICE', 'Car Washing & Detailing',
                   'Come to your location in Kumasi',              30.00);

-- Sample messages
INSERT INTO messages (sender_id, receiver_id, listing_id, body) VALUES
    (2, 1, 1, 'Hi Kofi, is the Samsung still available?'),
    (1, 2, 1, 'Yes, still available! When do you want to see it?'),
    (2, 1, 1, 'Can we meet tomorrow around 10am?'),
    (3, 2, 4, 'Is the laptop negotiable?'),
    (2, 3, 4, 'I can do 1100 if you pay today.');

-- Sample orders
INSERT INTO orders (listing_id, buyer_id, seller_id, amount, status) VALUES
    (3, 1, 2, 80.00, 'PAID');
Add PostgreSQL schema.sql

