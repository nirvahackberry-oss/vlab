# Ignito Learn — Admin Panel

Standalone admin console for managing users, credits, courses, semesters, and labs. UI matches the main Ignito Learn dashboard (red accent, soft cards, sidebar layout).

## Structure

```
admin/
├── backend/     # Express API (port 8090)
└── frontend/    # React + Vite (port 5174)
```

## Quick start

### 1. Admin API

```bash
cd admin/backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:8090/api`

On first run, data is seeded from `backend/data/users.js` and `backend/config/labs.js` into `admin/backend/data/platform.json`.

**Login (seeded admins):**

| Email | Password | Role |
|-------|----------|------|
| admin@ignito.com | admin123 | Super Admin |

### 2. Admin UI

```bash
cd admin/frontend
cp .env.example .env
# Copy branding assets from main app (once):
#   xcopy /E /I ..\..\frontend\public\assets public\assets
npm install
npm run dev
```

Open: `http://localhost:5174`

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/dashboard/stats` | Dashboard metrics |
| GET/POST/PATCH/DELETE | `/api/users` | User CRUD (includes course & semester enrollment) |
| POST | `/api/users/bulk-upload` | Excel bulk import (max 500 rows) |
| GET | `/api/users/bulk-template` | Download import template |
| PATCH | `/api/users/:id/credits` | Credit adjust (+/−) |
| GET/POST/PATCH/DELETE | `/api/roles` | Role management & default credits |
| GET/POST/PATCH/DELETE | `/api/courses` | Course CRUD |
| GET/POST/PATCH/DELETE | `/api/semesters` | Semester CRUD |
| GET/POST/PATCH/DELETE | `/api/labs` | Lab CRUD |
| GET | `/api/credits/transactions` | Credit audit log (Transactions page) |

All routes except `/auth/login` and `/health` require `Authorization: Bearer <token>` and an admin role (`Super Admin` or `Tenant Admin`).

## Production notes

- Set strong `JWT_SECRET` in `admin/backend/.env`.
- Replace JSON file store with DynamoDB/PostgreSQL for multi-instance deploys.
- Sync lab catalog to the main student API (`backend/config/labs.js` or a shared config service) when you wire production data.
