CREATE TABLE IF NOT EXISTS users (
    email VARCHAR PRIMARY KEY,
    password VARCHAR NOT NULL
);

INSERT INTO users (email, password)
VALUES
    ('alice@example.com', '$2b$12$NUDGea7mj3FyN3PU3i9PuO.HD8cEDYlOmE2ck3LtldGqa6t7cpvaK'),  -- password123
    ('bob@example.com',   '$2b$12$qlduY0lgnUuHGmwFTsJY..SbcyuX6d1QwqMR/AEyMiCDKXYyP/ubS');   -- password456
