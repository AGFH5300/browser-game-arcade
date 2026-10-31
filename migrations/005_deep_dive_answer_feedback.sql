-- Review queue only. No trigger or code path can modify scored answers.
CREATE TABLE IF NOT EXISTS deep_dive_answer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id varchar(100) NOT NULL,
  prompt varchar(280) NOT NULL,
  proposed_answer varchar(256) NOT NULL,
  context_mode varchar(32) NOT NULL,
  source_label varchar(70) NOT NULL DEFAULT '',
  player_note varchar(500) NOT NULL DEFAULT '',
  identifier_hash char(64) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','investigating','valid_unscored','invalid','duplicate')),
  reviewer_note varchar(500) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deep_dive_answer_feedback_queue_idx
 ON deep_dive_answer_feedback(status,created_at DESC);
CREATE INDEX IF NOT EXISTS deep_dive_answer_feedback_question_idx
 ON deep_dive_answer_feedback(question_id,created_at DESC);
CREATE TABLE IF NOT EXISTS deep_dive_feedback_rate_limits (
  identifier_hash char(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started timestamptz NOT NULL DEFAULT now()
);
