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

  // CORS: accepte une ou plusieurs origines séparées par des virgules
  const origins = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
  app.use(cors({ origin: origins.length ? origins : true, credentials: true }))

  app.use(express.json())

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRouter)
  app.use('/api/staff', staffRouter)
  app.use('/api/sanctions', sanctionsRouter)
  app.use('/api/recruitments', recruitmentsRouter)
  app.use('/api/users', usersRouter)

  app.use((req, res) => res.status(404).json({ error: 'Not found' }))

  // handler erreurs (facultatif en serverless, mais ok)
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}

const app = buildApp()
export default app
