import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole, ROLES } from '../middleware/auth.js';

const router = Router();
const allowedRoles = [ROLES.GERANT, ROLES.RESPONSABLE_STAFF, ROLES.ADMINISTRATEUR, ROLES.SUPER_ADMIN];

// GET (paginated)
router.get('/', authRequired, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      'SELECT * FROM staff ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const { rows: t } = await pool.query('SELECT COUNT(*)::int AS count FROM staff');

    res.json({ items: rows, total: t[0].count, page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST
router.post('/', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const {
    discord_id, pseudo_discord, nom, role_staff, pole, date_entree,
    statut, role_rp_principal, referent
  } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO staff (discord_id, pseudo_discord, nom, role_staff, pole, date_entree, statut, role_rp_principal, referent, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [discord_id || null, pseudo_discord || null, nom || null, role_staff || null, pole || null,
       date_entree || null, statut || null, role_rp_principal || null, referent || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT
router.put('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const id = req.params.id;
  const fields = ['discord_id','pseudo_discord','nom','role_staff','pole','date_entree','statut','role_rp_principal','referent'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(req.body, f)) {
      updates.push(`${f}=$${values.length + 1}`);
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
  try {
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE staff SET ${updates.join(',')} WHERE id=$${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE
router.delete('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  try {
    await pool.query('DELETE FROM staff WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
