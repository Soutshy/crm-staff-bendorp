import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole, ROLES } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const allowedRoles = [ROLES.GERANT, ROLES.RESPONSABLE_STAFF, ROLES.ADMINISTRATEUR, ROLES.SUPER_ADMIN];

function getRecruitmentWebhook() {
  return process.env.DISCORD_WEBHOOK_RECRUITMENT_URL || process.env.DISCORD_WEBHOOK_URL;
}

async function sendDiscordDecision({ decision, rec, recruiterName }) {
  const url = getRecruitmentWebhook();
  if (!url) return;

  const green = 0x22c55e, red = 0xef4444;
  const color = decision === 'accepted' ? green : red;

  const embed = {
    title: decision === 'accepted' ? 'Candidature ACCEPTÉE' : 'Candidature REFUSÉE',
    color,
    fields: [
      { name: 'Candidat', value: `${rec.candidate_name || '-'} (${rec.pseudo_discord || '—'})` },
      { name: 'Poste souhaité', value: rec.poste_souhaite || '—', inline: true },
      { name: 'Recruteur', value: recruiterName || '—', inline: true },
      { name: "Date d'entrée", value: rec.entry_date ? String(rec.entry_date).slice(0,10) : '—', inline: true },
      { name: 'Note', value: rec.decision_note || rec.notes || '—' }
    ],
    timestamp: new Date().toISOString()
  };

  const payload = {
    content: rec.discord_id ? `<@${rec.discord_id}>` : undefined,
    allowed_mentions: rec.discord_id ? { users: [String(rec.discord_id)] } : undefined,
    embeds: [embed]
  };

  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    console.error('Discord recruitment webhook error:', e.message);
  }
}

// LIST (paginated)
router.get('/', authRequired, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;
    const data = await pool.query('SELECT * FROM recruitments ORDER BY updated_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const total = await pool.query('SELECT COUNT(*)::int AS count FROM recruitments');
    res.json({ items: data.rows, total: total.rows[0].count, page, limit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CREATE
router.post('/', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const { candidate_name, discord, discord_id, pseudo_discord, poste_souhaite, status, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO recruitments (candidate_name, discord, discord_id, pseudo_discord, poste_souhaite, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [candidate_name || null, discord || null, discord_id || null, pseudo_discord || null, poste_souhaite || null, status || 'applied', notes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE (avant décision)
router.put('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const id = req.params.id;
  const fields = ['candidate_name','discord','discord_id','pseudo_discord','poste_souhaite','status','notes'];
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
      `UPDATE recruitments SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', authRequired, requireRole(...allowedRoles), async (req, res) => {
  try { await pool.query('DELETE FROM recruitments WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// REVIEWS list
router.get('/:id/reviews', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.display_name AS reviewer_name
       FROM recruitment_reviews r LEFT JOIN users u ON u.id=r.reviewer_id
       WHERE r.recruitment_id=$1 ORDER BY r.created_at DESC`,
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
      `INSERT INTO recruitment_reviews (recruitment_id, reviewer_id, vote, comment)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, vote, comment || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DECIDE (accept/reject) + webhook (salon dédié recrutement)
router.post('/:id/decide', authRequired, requireRole(...allowedRoles), async (req, res) => {
  const { decision, entry_date, note } = req.body;
  if (!['accepted','rejected'].includes(decision)) return res.status(400).json({ error: 'Décision invalide' });
  if (decision === 'accepted' && !entry_date) return res.status(400).json({ error: "Date d'entrée requise" });

  try {
    const { rows } = await pool.query(
      `UPDATE recruitments
       SET status=$1, recruited_by=$2, decision_note=$3, entry_date=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [decision, req.user.id, note || null, entry_date || null, req.params.id]
    );
    const rec = rows[0];
    const recruiterName = req.user.display_name || req.user.email;
    await sendDiscordDecision({ decision, rec, recruiterName });
    res.json(rec);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
