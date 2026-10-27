CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS games (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '', short_description text NOT NULL DEFAULT '', thumbnail text,
 categories text[] NOT NULL DEFAULT '{}', tags text[] NOT NULL DEFAULT '{}', developer text NOT NULL DEFAULT '', engine text NOT NULL CHECK(engine IN ('html5','iframe','flash')),
 game_url text NOT NULL, source_url text NOT NULL DEFAULT '', license text NOT NULL DEFAULT '', license_notes text NOT NULL DEFAULT '', mobile boolean NOT NULL DEFAULT false,
 controls text NOT NULL DEFAULT '', instructions text NOT NULL DEFAULT '', featured boolean NOT NULL DEFAULT false, published boolean NOT NULL DEFAULT false,
 display_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX IF NOT EXISTS games_published_order_idx ON games(published,display_order,title);
CREATE INDEX IF NOT EXISTS games_categories_idx ON games USING gin(categories);
CREATE TABLE IF NOT EXISTS thumbnails(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mime_type text NOT NULL CHECK(mime_type IN ('image/png','image/jpeg','image/webp')), data bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS admins(username text PRIMARY KEY, password_hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS login_attempts(identifier_hash text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, window_started timestamptz NOT NULL DEFAULT now(), blocked_until timestamptz);
CREATE TABLE IF NOT EXISTS game_metrics(game_id uuid PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE, play_count bigint NOT NULL DEFAULT 0, likes bigint NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS play_events(id bigserial PRIMARY KEY, game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE, occurred_at timestamptz NOT NULL DEFAULT now());
