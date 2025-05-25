CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    email VARCHAR PRIMARY KEY,
    password VARCHAR NOT NULL
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
    trained BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_training_trained ON training_samples (trained);

CREATE INDEX IF NOt EXISTS idx_training_email ON training_samples (email);

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