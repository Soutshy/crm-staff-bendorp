import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

async function ensureSchema() {
  // quick load of schema file if exists
  try {
    const fs = await import('fs');
    const path = new URL('./schema.sql', import.meta.url);
    const sql = fs.readFileSync(path, 'utf8');
    await pool.query(sql);
  } catch (e) {
    console.log('Schema load warning:', e.message);
  }
}

async function main() {
  await ensureSchema();
  const email = process.env.SEED_EMAIL || 'admin@bendorp.gg';
  const password = process.env.SEED_PASSWORD || 'ChangeMe!23';
  const display = process.env.SEED_DISPLAY_NAME || 'Super Admin';
  const hash = await bcrypt.hash(password, 10);
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.rowCount) {
      console.log('User already exists, skipping:', email);
    } else {
      await pool.query(
        "INSERT INTO users (email, password_hash, role, display_name) VALUES ($1,$2,'SUPER_ADMIN',$3)",
        [email.toLowerCase(), hash, display]
      );
      console.log('Seeded SUPER_ADMIN:', email);
    }
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await pool.end();
  }
}

main();
