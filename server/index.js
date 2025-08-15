// server/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRouter from './routes/auth.js'
import staffRouter from './routes/staff.js'
import sanctionsRouter from './routes/sanctions.js'
import recruitmentsRouter from './routes/recruitments.js'
import usersRouter from './routes/users.js'

dotenv.config()

// ---- CORS : autorise localhost, *.vercel.app et les origines listées dans CLIENT_ORIGIN (séparées par des virgules)
const originsFromEnv = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

function isAllowedOrigin(origin) {
  try {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost') return true
    if (hostname.endsWith('.vercel.app')) return true
    // whitelist explicite depuis CLIENT_ORIGIN
    for (const o of originsFromEnv) {
      try { if (new URL(o).hostname === hostname) return true } catch {}
    }
    return false
  } catch {
    return false
  }
}

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // SSR/healthcheck
    return isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('CORS: origin non autorisée'))
  },
  credentials: true,
}

// ---- App
const app = express()
app.use(cors(corsOptions))
app.use(express.json())

// Health
app.get('/', (req, res) => res.json({ ok: true, service: 'BendoRP API' }))
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Routes API
app.use('/api/auth', authRouter)
app.use('/api/staff', staffRouter)
app.use('/api/sanctions', sanctionsRouter)
app.use('/api/recruitments', recruitmentsRouter)
app.use('/api/users', usersRouter)

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// Erreurs
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app

// ---- Démarrage local uniquement (Vercel importe l'app sans listen)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => console.log(`Server listening on :${PORT}`))
}
