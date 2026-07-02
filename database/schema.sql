-- Nearbuy Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    trust_score INT DEFAULT 100,
    id_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listings table
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('GOOD','SERVICE','RENTAL')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) CHECK (price >= 0),
    status VARCHAR(20) CHECK (status IN ('ACTIVE','PAUSED')),
    image_url TEXT,
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rental details
CREATE TABLE rental_details (
    listing_id INT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    deposit_amount NUMERIC(12,2),
    min_duration INT,
    max_duration INT,
    return_condition_photos TEXT
);

-- Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id INT REFERENCES users(id),
    seller_id INT REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING','PAID','COMPLETED')),
    escrow_amount NUMERIC(12,2),
    paid_at TIMESTAMP,
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(10) CHECK (type IN ('CREDIT','DEBIT')),
    amount NUMERIC(12,2) NOT NULL,
    reference VARCHAR(100),
    balance_after NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    reviewer_id INT REFERENCES users(id),
    reviewee_id INT REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_messages_listing ON messages(listing_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
Add database schema and seed data
