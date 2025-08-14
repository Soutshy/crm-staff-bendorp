# BendoRP Staff CRM

Full-stack CRM pour gérer le **staff**, les **recrutements** et les **sanctions** sur votre serveur FiveM.

## ⚙️ Stack
- Backend: Node.js (Express) + PostgreSQL (Neon). Auth JWT + RBAC.
- Frontend: React + Vite + Tailwind (mode clair/sombre, violet/rose).

## 🚀 Démarrage rapide

### 1) Backend
```bash
cd server
cp .env.example .env
# Remplissez DATABASE_URL (Neon), CLIENT_ORIGIN et JWT_SECRET
npm install
npm run db:init       # crée les tables
npm run seed          # crée le compte SUPER_ADMIN générique (voir .env)
npm run dev           # démarre sur http://localhost:4000
```

### 2) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
```

### Connexion générique (créée par `npm run seed`)
- **Email**: `admin@bendorp.gg`
- **Mot de passe**: `ChangeMe!23`
> Changez ces informations après la première connexion.

## 🔐 Rôles autorisés
- GERANT
- RESPONSABLE_STAFF
- ADMINISTRATEUR
- SUPER_ADMIN (peut créer des comptes)

## 🔗 Variables d'environnement
- **SERVER** `.env`: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`
- **CLIENT** `.env`: `VITE_API_URL=http://localhost:4000`

## 📦 Endpoints (extraits)
- `POST /api/auth/login`
- `POST /api/users` *(SUPER_ADMIN)* — créer un compte
- `GET /api/users` *(SUPER_ADMIN)* — lister
- CRUD `/api/staff`, `/api/sanctions`, `/api/recruitments`

## 🎨 Thème
- Couleurs principales: violet avec **accents rose**.
- Light: fond blanc.
- Dark: fond noir/gris.
