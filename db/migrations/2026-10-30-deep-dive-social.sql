-- Sidequest Deep Dive accounts / friends / verified daily results / rated parties
-- Additive; all names isolated from existing arcade tables. Never stores plaintext passwords or session tokens.
CREATE TABLE IF NOT EXISTS deep_dive_accounts (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,18}$'),
  display_name text NOT NULL,
  password_hash text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  share_answers boolean NOT NULL DEFAULT true,
  daily_streak integer NOT NULL DEFAULT 0 CHECK (daily_streak >= 0),
  rating integer NOT NULL DEFAULT 1200 CHECK (rating >= 0),
  rated_games integer NOT NULL DEFAULT 0 CHECK (rated_games >= 0),
  rated_wins integer NOT NULL DEFAULT 0 CHECK (rated_wins >= 0),
  rated_losses integer NOT NULL DEFAULT 0 CHECK (rated_losses >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deep_dive_sessions (
  token_hash char(64) PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deep_dive_sessions_account_idx ON deep_dive_sessions (account_id);
CREATE INDEX IF NOT EXISTS deep_dive_sessions_expiry_idx ON deep_dive_sessions (expires_at);
CREATE TABLE IF NOT EXISTS deep_dive_friendships (
  account_a uuid NOT NULL REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  account_b uuid NOT NULL REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  requester uuid NOT NULL REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN ('pending','accepted','blocked')),
  blocked_by uuid REFERENCES deep_dive_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_a,account_b),
  CHECK (account_a < account_b)
);
CREATE TABLE IF NOT EXISTS deep_dive_daily_results (
  account_id uuid NOT NULL REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  dive_date date NOT NULL,
  points integer NOT NULL CHECK (points BETWEEN 0 AND 700),
  results jsonb NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id,dive_date)
);
CREATE INDEX IF NOT EXISTS deep_dive_daily_results_date ON deep_dive_daily_results (dive_date,points DESC);
CREATE TABLE IF NOT EXISTS deep_dive_auth_limits (
  identifier char(64) PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deep_dive_matchmaking (
  account_id uuid PRIMARY KEY REFERENCES deep_dive_accounts(id) ON DELETE CASCADE,
  desired_capacity integer NOT NULL DEFAULT 2 CHECK (desired_capacity IN (2,3,6,8)),
  rated boolean NOT NULL DEFAULT true,
  room_code varchar(6),
  player_id char(48),
  player_secret char(48),
  state text NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting','matched')),
  queued_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deep_dive_matchmaking_wait ON deep_dive_matchmaking (state,rated,desired_capacity,queued_at);
CREATE TABLE IF NOT EXISTS deep_dive_rated_matches (
  room_code varchar(6) PRIMARY KEY,
  account_a uuid NOT NULL REFERENCES deep_dive_accounts(id),
  account_b uuid NOT NULL REFERENCES deep_dive_accounts(id),
  score_a integer NOT NULL,
  score_b integer NOT NULL,
  delta_a integer NOT NULL,
  delta_b integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
