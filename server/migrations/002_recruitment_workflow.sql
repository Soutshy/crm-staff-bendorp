-- === Recrutement : workflow avancé ===

-- Infos détaillées du candidat
ALTER TABLE recruitments
  ADD COLUMN IF NOT EXISTS discord_id TEXT,
  ADD COLUMN IF NOT EXISTS pseudo_discord TEXT,
  ADD COLUMN IF NOT EXISTS poste_souhaite TEXT,
  ADD COLUMN IF NOT EXISTS recruited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decision_note TEXT,
  ADD COLUMN IF NOT EXISTS entry_date DATE;

-- Table des avis/validations
CREATE TABLE IF NOT EXISTS recruitment_reviews (
  id SERIAL PRIMARY KEY,
  recruitment_id INTEGER NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  vote TEXT CHECK (vote IN ('up','down')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
