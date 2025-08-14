import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole, ROLES } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const allowedRoles = [ROLES.GERANT, ROLES.RESPONSABLE_STAFF, ROLES.ADMINISTRATEUR, ROLES.SUPER_ADMIN];

function getSanctionWebhook() {
  return process.env.DISCORD_WEBHOOK_SANCTION_URL || process.env.DISCORD_WEBHOOK_URL;
}

// Envoi embed Discord avec logs détaillés
async function sendDiscordSanction({ decision, sanction, staffRow, reviewerName }) {
  // Fallback fetch si besoin
  if (typeof fetch !== 'function') {
    const { fetch: undiciFetch } = await import('undici');
    global.fetch = undiciFetch;
  }

  const url = getSanctionWebhook();
  if (!url) {
    console.warn('[Webhook][Sanction] URL absente (DISCORD_WEBHOOK_SANCTION_URL ou DISCORD_WEBHOOK_URL).');
    return;
  }

  const green = 0x22c55e, red = 0xef4444;
  const color = decision === 'approved' ? green : red;

  const period = (sanction.start_date ? String(sanction.start_date).slice(0,10) : '—')
    + ' → ' + (sanction.end_date ? String(sanction.end_date).slice(0,10) : '—');

  const embed = {
    title: decision === 'approved' ? 'Sanction APPROUVÉE' : 'Sanction REJETÉE',
    color,
    fields: [
      { name: 'Staff', value: `${staffRow?.nom || staffRow?.pseudo_discord || staffRow?.discord_id || '—'}` },
      { name: 'Type', value: sanction.type || '—', inline: true },
      { name: 'Période', value: period, inline: true },
      { name: 'Raison', value: sanction.reason || '—' },
      { name: 'Décision par', value: reviewerName || '—', inline: true },
      { name: 'Note', value: sanction.decision_note || '—' }
    ],
    timestamp: new Date().toISOString()
  };

  const payload = {
    ...(staffRow?.discord_id ? {
      content: `<@${staffRow.discord_id}>`,
      allowed_mentions: { users: [String(staffRow.discord_id)] }
    } : {}),
    embeds: [embed]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text(); // Discord renvoie souvent 204 (no body)
    if (!res.ok) {
      console.error('[Webhook][Sanction] ÉCHEC', res.status, text);
    } else {
      console.log('[Webhook][Sanction] OK', res.status, text || '(no body)');
    }
  } catch (e) {
    console.error('[Webhook][Sanction] Exception', e.message);
  }
}

// GET paginated
router.get('/', authRequired, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const data = await pool.query(
      `SELECT s.*, st.nom as staff_nom, st.pseudo_discord as staff_pseudo, st.discord_id as staff_discord_id
       FROM sanctions s
       LEFT JOIN staff st ON st.id=s.staff_id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = await pool.query('SELECT COUNT(*)::int AS count FROM sanctions');
    res.json({ items: data.rows, total: total.rows[0].count, page, limit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE (proposed)
router.post('/', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const { staff_id, type, reason, start_date, end_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sanctions (staff_id, type, reason, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,'proposed',$6) RETURNING *`,
      [staff_id, type || null, reason || null, start_date || null, end_date || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE (while proposed)
router.put('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const id = req.params.id;
  const fields = ['staff_id','type','reason','start_date','end_date'];
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
      `UPDATE sanctions SET ${updates.join(',')} WHERE id=$${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE — avec RETURNING pour vérifier la suppression + logs clairs
router.delete('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM sanctions WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Sanction introuvable' });
    console.log('[Sanction][DELETE] id', rows[0].id, 'supprimée');
    res.json({ ok: true });
  } catch (e) {
    console.error('[Sanction][DELETE] erreur:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// REVIEWS list
router.get('/:id/reviews', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.display_name AS reviewer_name
       FROM sanction_reviews r LEFT JOIN users u ON u.id=r.reviewer_id
       WHERE r.sanction_id=$1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ADD REVIEW
router.post('/:id/reviews', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const { vote, comment } = req.body;
  if (!['up','down'].includes(vote)) return res.status(400).json({ error: 'Vote invalide' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO sanction_reviews (sanction_id, reviewer_id, vote, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, vote, comment || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DECIDE (approve/reject) + webhook
router.post('/:id/decide', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const { decision, note } = req.body;
  if (!['approved','rejected'].includes(decision)) return res.status(400).json({ error: 'Décision invalide' });

  try {
    console.log('[Sanction][Decide] id', req.params.id, 'decision', decision);
    const { rows } = await pool.query(
      `UPDATE sanctions
       SET status=$1, reviewed_by=$2, decision_note=$3, decided_at=NOW()
       WHERE id=$4 RETURNING *`,
      [decision, req.user.id, note || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Sanction introuvable' });
    const sanction = rows[0];

    const staffQ = await pool.query('SELECT id, nom, pseudo_discord, discord_id FROM staff WHERE id=$1', [sanction.staff_id]);
    const staffRow = staffQ.rows[0];
    const reviewerName = req.user.display_name || req.user.email;

    console.log('[Webhook][Sanction] Envoi…', { decision, staffId: staffRow?.discord_id, sanctionId: sanction.id });
    await sendDiscordSanction({ decision, sanction, staffRow, reviewerName });

    res.json(sanction);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// NEW: NOTIFY — relancer l’embed sans changer la sanction
router.post('/:id/notify', authRequired, requireRole(...allowedRoles), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sanctions WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Sanction introuvable' });
    const sanction = rows[0];

    const staffQ = await pool.query('SELECT id, nom, pseudo_discord, discord_id FROM staff WHERE id=$1', [sanction.staff_id]);
    const staffRow = staffQ.rows[0];
    const reviewerName = req.user.display_name || req.user.email;
    const decision = sanction.status === 'approved' ? 'approved' : 'rejected';

    console.log('[Webhook][Sanction][Notify] id', sanction.id, 'decision', decision);
    await sendDiscordSanction({ decision, sanction, staffRow, reviewerName });

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
