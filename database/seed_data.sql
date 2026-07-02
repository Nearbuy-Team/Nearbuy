-- Demo Users
INSERT INTO users (full_name, email, phone, password_hash, trust_score, id_verified)
VALUES
('Ama Boateng','ama@example.com','+233200000001','hashed_pw1',92,TRUE),
('Kwame Asante','kwame@example.com','+233200000002','hashed_pw2',85,FALSE),
('Mensah Ofori','mensah@example.com','+233200000003','hashed_pw3',70,FALSE);

-- Demo Listings
INSERT INTO listings (user_id, type, title, description, price, status, image_url, views)
VALUES
(1,'GOOD','Used iPhone 12','Slightly used, 128GB',3500,'ACTIVE','/images/iphone.jpg',12),
(2,'SERVICE','AC Repair Service','Fast and reliable repairs',120,'ACTIVE','/images/ac.jpg',5),
(3,'RENTAL','Generator Rental','5kVA generator, daily rate',500,'ACTIVE','/images/gen.jpg',8);

-- Demo Wallet Transactions
INSERT INTO wallet_transactions (user_id,type,amount,reference,balance_after)
VALUES
(1,'CREDIT',500,'Top-up',500),
(2,'DEBIT',120,'AC repair escrow',380),
(3,'DEBIT',500,'Generator deposit',200);
