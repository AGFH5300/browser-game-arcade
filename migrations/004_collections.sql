ALTER TABLE games ADD COLUMN IF NOT EXISTS collections text[] NOT NULL DEFAULT '{}';

-- Preserve every existing record and metric while assigning launch titles to
-- the HTML5 puzzle collection. Hextris also appears in Classics.
UPDATE games
SET collections = CASE WHEN slug = 'hextris'
  THEN ARRAY['html5_puzzles', 'classics']::text[]
  ELSE ARRAY['html5_puzzles']::text[]
END
WHERE cardinality(collections) = 0;

CREATE INDEX IF NOT EXISTS games_collections_idx ON games USING gin(collections);
