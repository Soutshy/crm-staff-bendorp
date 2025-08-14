import { Router } from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { authRequired, requireRole, ROLES } from '../middleware/auth.js';

const router = Router();

// Only SUPER_ADMIN can create/list users
router.post('/', authRequired, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  const { email, password, role, display_name } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Champs manquants' });
  if (!Object.values(ROLES).includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, role, display_name) VALUES ($1,$2,$3,$4) RETURNING id, email, role, display_name',
      [email.toLowerCase(), hash, role, display_name || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/', authRequired, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, role, display_name, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
