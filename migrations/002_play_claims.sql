CREATE TABLE IF NOT EXISTS play_claims(identifier_hash text PRIMARY KEY,last_counted timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS play_claims_counted_idx ON play_claims(last_counted);
