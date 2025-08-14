-- Users & RBAC
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('GERANT','RESPONSABLE_STAFF','ADMINISTRATEUR','SUPER_ADMIN')),
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Staff "Effectifs"
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  discord_id TEXT,
  pseudo_discord TEXT,
  nom TEXT,
  role_staff TEXT,
  pole TEXT,
  date_entree DATE,
  statut TEXT,
  role_rp_principal TEXT,
  referent TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sanctions
CREATE TABLE IF NOT EXISTS sanctions (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  type TEXT,
  reason TEXT,
  start_date DATE,
  end_date DATE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recruitments
CREATE TABLE IF NOT EXISTS recruitments (
  id SERIAL PRIMARY KEY,
  candidate_name TEXT,
  discord TEXT,
  status TEXT CHECK (status IN ('applied','interview','accepted','rejected')) DEFAULT 'applied',
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
