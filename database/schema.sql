-- ==========================================
-- EXTENSIONS & ENUMS
-- ==========================================
CREATE TYPE listing_type AS ENUM ('GOOD', 'SERVICE', 'RENTAL');
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'COMPLETED');
CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT');

-- ==========================================
-- TABLES DEFINITIONS
-- ==========================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    trust_score INT DEFAULT 100 CHECK (trust_score BETWEEN 0 AND 100),
    id_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type listing_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status listing_status DEFAULT 'ACTIVE',
    image_url TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    views INT DEFAULT 0 CHECK (views >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE rental_details (
    listing_id BIGINT PRIMARY KEY,
    deposit_amount NUMERIC(12, 2) NOT NULL CHECK (deposit_amount >= 0),
    min_duration INT DEFAULT 1 CHECK (min_duration > 0),
    max_duration INT CHECK (max_duration >= min_duration),
    return_condition_photos TEXT[], 
    CONSTRAINT fk_rental_details_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status order_status DEFAULT 'PENDING',
    escrow_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (escrow_amount >= 0),
    paid_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reference VARCHAR(100) UNIQUE NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_listings_type_status ON listings(type, status);
CREATE INDEX idx_listings_search_gin ON listings USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_wallet_tx_user_id ON wallet_transactions(user_id);
