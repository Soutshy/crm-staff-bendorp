// server/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRouter from './routes/auth.js'
import staffRouter from './routes/staff.js'
import sanctionsRouter from './routes/sanctions.js'
import recruitmentsRouter from './routes/recruitments.js'
import usersRouter from './routes/users.js'   // <= ta nouvelle route comptes

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// Middlewares
app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json())

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Routes API
app.use('/api/auth', authRouter)
app.use('/api/staff', staffRouter)
app.use('/api/sanctions', sanctionsRouter)
app.use('/api/recruitments', recruitmentsRouter)
app.use('/api/users', usersRouter)           // <= branchée APRÈS la création de app

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// Handler d’erreurs
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start
app.listen(PORT, () => console.log(`Server listening on :${PORT}`))
