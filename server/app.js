import cors from 'cors'

// ...
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // requêtes server-side / healthcheck

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
  credentials: true, // OK même si tu n’utilises pas de cookies
}

app.use(cors(corsOptions))
