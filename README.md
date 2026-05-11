# VMR Backend v2 — SQLite Edition
Vehicle Maintenance Record · Node.js + Express + SQLite

## ✅ No MySQL needed — zero database setup!

---

## 📁 Folder Structure
```
vmr-backend/
├── config/
│   ├── db.js       ← SQLite connection
│   ├── init.js     ← Auto-creates tables on startup
│   └── setup.js    ← Optional manual setup
├── controllers/
│   ├── authController.js
│   └── recordsController.js
├── middleware/
│   └── auth.js     ← JWT verification
├── routes/
│   ├── auth.js
│   └── records.js
├── data/           ← SQLite database file lives here (auto-created)
│   └── vmr.db
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## ⚙️ Setup (3 steps only!)

### 1. Install dependencies
```bash
npm install
```

### 2. Edit .env
```
JWT_SECRET=any_long_random_string
CORS_ORIGIN=*
```
That's it — no database password needed!

### 3. Start server
```bash
npm run dev
```

On first start, the server automatically:
- Creates the SQLite database file
- Creates all tables
- Creates admin user (admin / admin123)

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login |
| GET  | `/api/auth/me` | ✅ | Get user info |
| POST | `/api/auth/change-password` | ✅ | Change password |
| GET  | `/api/records/all` | ✅ | Dashboard stats |
| GET  | `/api/records/:vehicle` | ✅ | Get records |
| POST | `/api/records/:vehicle` | ✅ | Add record |
| DELETE | `/api/records/:vehicle/:id` | ✅ | Delete record |
| GET  | `/api/health` | ❌ | Health check |

---

## 🚀 Deploy to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Add one environment variable:
   ```
   JWT_SECRET=your_secret_here
   ```
4. Deploy — Railway handles everything else!

Default login: **admin / admin123**
