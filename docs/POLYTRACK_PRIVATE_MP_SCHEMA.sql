-- Pilot-only Sidequest multiplayer signaling. Does not touch Kodub's services.
-- Run on Neon only after the isolated Vercel pilot is verified.
CREATE TABLE IF NOT EXISTS sidequest_polytrack_rooms (
  invite_code varchar(8) PRIMARY KEY,
  invite_key uuid NOT NULL UNIQUE,
  host_channel uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sidequest_polytrack_rooms_expiry ON sidequest_polytrack_rooms(expires_at);
CREATE TABLE IF NOT EXISTS sidequest_polytrack_sessions (
  session_id uuid PRIMARY KEY,
  invite_code varchar(8) NOT NULL REFERENCES sidequest_polytrack_rooms(invite_code) ON DELETE CASCADE,
  host_channel uuid NOT NULL,
  join_channel uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sidequest_polytrack_sessions_room ON sidequest_polytrack_sessions(invite_code);
CREATE TABLE IF NOT EXISTS sidequest_polytrack_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient uuid NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sidequest_polytrack_events_recipient_id ON sidequest_polytrack_events(recipient,id);
COMMENT ON TABLE sidequest_polytrack_rooms IS 'Experimental Sidequest-only PolyTrack peer connection signaling. Not official Kodub rooms.';
