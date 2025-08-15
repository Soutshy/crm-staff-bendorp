import dotenv from 'dotenv'
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL
let pool

if (process.env.VERCEL) {
  const { neon, neonConfig } = await import('@neondatabase/serverless')
  neonConfig.fetchConnectionCache = true
  const sql = neon(DATABASE_URL)
  pool = { query: async (text, params=[]) => ({ rows: await sql(text, params) }) }
  console.log('[DB] Neon serverless client (Vercel)')
} else {
  const { Pool } = await import('pg')
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  console.log('[DB] pg Pool (local/dev)')
}
export { pool }
