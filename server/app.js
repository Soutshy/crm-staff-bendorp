// server/app.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRouter from './routes/auth.js'
import staffRouter from './routes/staff.js'
import sanctionsRouter from './routes/sanctions.js'
import recruitmentsRouter from './routes/recruitments.js'
import usersRouter from './routes/users.js'

dotenv.config()

export function buildApp() {
  const app = express()

  // Autorise plusieurs origines (localhost + *.vercel.app)
  const corsOptions = {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      try {
        const { hostname } = new URL(origin)
        const allowed =
          hostname === 'localhost' ||
          hostname.endsWith('.vercel.app')
        return allowed ? cb(null, true) : cb(new Error('CORS: origin non autorisée'))
      } catch {
        return cb(new Error('CORS: origin invalide'))
      }
    },
    credentials: true,
  }
  app.use(cors(corsOptions))
  app.use(express.json())

  // Health
  app.get('/', (req, res) => res.json({ ok: true, service: 'BendoRP API' }))
  app.get('/api/health', (req, res) => res.json({ ok: true }))

  // Routes
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

  return app
}

const app = buildApp()
export default app
