// server/db.js
import dotenv from 'dotenv'
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.warn('[DB] DATABASE_URL manquant. Pense à le définir dans les variables Vercel/locaux.')
}

let pool

if (process.env.VERCEL) {
  // --- Vercel serverless : utilise le client fetch-based de Neon
  const { neon, neonConfig } = await import('@neondatabase/serverless')
  neonConfig.fetchConnectionCache = true
  const sql = neon(DATABASE_URL)

  // Wrapper compatible avec pool.query(text, params)
  pool = {
    query: async (text, params = []) => {
      const rows = await sql(text, params)
      return { rows }
    },
  }
  console.log('[DB] Neon serverless client (Vercel)')
} else {
  // --- Dev/local : pool pg classique
  const { Pool } = await import('pg')
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  console.log('[DB] pg Pool (local/dev)')
}

export { pool }
