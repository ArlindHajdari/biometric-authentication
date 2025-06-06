CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    email VARCHAR PRIMARY KEY,
    password VARCHAR NOT NULL,
    mode VARCHAR DEFAULT 'train',
    successful_logins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO users (email, password)
VALUES
    ('alice@example.com', '$2b$12$NUDGea7mj3FyN3PU3i9PuO.HD8cEDYlOmE2ck3LtldGqa6t7cpvaK'),  -- password123
    ('bob@example.com',   '$2b$12$qlduY0lgnUuHGmwFTsJY..SbcyuX6d1QwqMR/AEyMiCDKXYyP/ubS'), -- password456
    ('arlind.hajdari@gmail.com', '$2b$12$A.ghhPR1woxApdUmQF7jJOd5tnEZB4c3s6K9AAf5/7N4D05n9tCEm');   -- password123 

CREATE TABLE IF NOT EXISTS training_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    hold_time JSONB,
    flight_time JSONB,
    mouse_velocity JSONB,
    click_frequency JSONB,
    dwell_time JSONB,
    scroll_distance JSONB,
    keypress_rate JSONB,
    cursor_variation JSONB,
    trained BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_training_trained ON training_samples (trained);

CREATE INDEX IF NOT EXISTS idx_training_email ON training_samples (email);

--VACUUM ANALYZE training_samples;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT * from cron.schedule(
    'nightly_training_cleanup',
    '*/5 * * * *',
    $$
    DELETE FROM training_samples
    WHERE trained = TRUE;
    $$
);

SELECT cron.schedule(
  'switch_train_to_auth_by_logins',
  '0 0 * * *', 
  $$
  UPDATE users
  SET mode = 'auth'
  WHERE mode = 'train' AND successful_logins >= 15
  $$
);

CREATE TABLE IF NOT EXISTS ip_trust_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL,
  ip_address VARCHAR NOT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '3 days',
  confirmed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_ips (
  email VARCHAR NOT NULL,
  ip_address VARCHAR NOT NULL,
  successful_logins INT DEFAULT 0,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, ip_address)
);
