CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(100)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(20),
    trust_score   INTEGER       DEFAULT 100,
    created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE listings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20)   NOT NULL CHECK (type IN ('GOOD', 'SERVICE', 'RENTAL')),
    title       VARCHAR(200)  NOT NULL,
    description TEXT,
    price       DECIMAL(10,2),
    status      VARCHAR(20)   DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE', 'SOLD', 'INACTIVE')),
    image_url   TEXT,
    created_at  TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE messages (
    id          SERIAL PRIMARY KEY,
    sender_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  INTEGER       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    body        TEXT          NOT NULL,
    sent_at     TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    listing_id  INTEGER       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      DECIMAL(10,2) NOT NULL,
    status      VARCHAR(20)   DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING', 'PAID', 'COMPLETED', 'CANCELLED')),
    created_at  TIMESTAMP     DEFAULT NOW()
);


-- listings: home feed (ACTIVE only) + filter by type + seller profile
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status  ON listings(status);
CREATE INDEX idx_listings_type    ON listings(type);-- messages: fetch a chat thread for a listing
CREATE INDEX idx_messages_listing ON messages(listing_id);-- orders: buyer history and seller history
CREATE INDEX idx_orders_buyer  ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);-- users: fast login lookup by email
CREATE INDEX idx_users_email ON users(email);


Add PostgreSQL schema.sql
