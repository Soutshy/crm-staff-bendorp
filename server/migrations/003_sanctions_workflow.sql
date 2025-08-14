-- === Workflow Sanctions ===

ALTER TABLE sanctions
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('proposed','approved','rejected')) DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decision_note TEXT,
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS sanction_reviews (
  id SERIAL PRIMARY KEY,
  sanction_id INTEGER NOT NULL REFERENCES sanctions(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  vote TEXT CHECK (vote IN ('up','down')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
