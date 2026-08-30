-- =============================================================================
-- KAVERI STAYS: AUTHENTICATION & PAYMENT IDEMPOTENCY EXTENSION (STAGE 5)
-- Safe, rerunnable schema that integrates with existing kaveri_stays database
-- =============================================================================

-- 1. Safely create user_role enum if it does not already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('guest', 'staff', 'manager', 'owner');
    END IF;
END $$;

-- 2. Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Users table (integrates with guests and properties)
CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'guest',
    guest_id        INT UNIQUE REFERENCES guests(guest_id) ON DELETE SET NULL,
    property_id     INT REFERENCES properties(property_id) ON DELETE SET NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_role_assignment CHECK (
        (role = 'guest' AND guest_id IS NOT NULL AND property_id IS NULL) OR
        (role IN ('staff', 'manager') AND property_id IS NOT NULL AND guest_id IS NULL) OR
        (role = 'owner' AND property_id IS NULL AND guest_id IS NULL)
    )
);

-- Case-insensitive unique email index matching guests table
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(TRIM(email)));

-- Apply auto-update trigger on users table
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Refresh Tokens table (token rotation & revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id        SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 5. Payment Idempotency table
CREATE TABLE IF NOT EXISTS payment_idempotency (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    booking_id      INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    payment_id      INT REFERENCES payments(payment_id) ON DELETE SET NULL,
    amount          NUMERIC(10, 2) NOT NULL,
    method          payment_method_type NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('in_flight', 'completed', 'failed')),
    response_body   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_idempotency_booking ON payment_idempotency(booking_id);
