# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack web application for daily pre-operational vehicle inspections (car/motorcycle) at Propartes. Two interfaces: a PWA for field users (no login) and an admin panel (desktop only, magic link auth). Stack: React 19 + Vite + Mantine UI (frontend), Node.js + Express 5 (backend), PostgreSQL 16 (database), orchestrated with Docker Compose. API versioned at `/api/v1/`.

## Development Commands

### Running the project (recommended)

```bash
docker-compose up          # Start all services
docker-compose up --build  # Rebuild and start
docker-compose down        # Stop all services
```

Services exposed:
- Frontend: http://localhost:5176
- Backend API: http://localhost:3006
- PostgreSQL: localhost:5432

### Frontend (standalone)

```bash
cd frontend
npm install
npm run dev      # Dev server with HMR on port 5173
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend (standalone)

```bash
cd backend
npm install
npm start        # Express server on port 3000
```

## Architecture

```
preoperacional_propartes/
├── backend/src/
│   ├── index.js              # Express app entry point
│   ├── db.js                 # PostgreSQL connection pool (pg)
│   ├── routes/               # Route handlers grouped by domain
│   ├── middleware/            # Auth (JWT), validation, error handling
│   ├── services/             # Business logic (holidays, alerts, reports)
│   ├── jobs/                 # Cron jobs (daily report, WhatsApp alerts, photo cleanup)
│   └── utils/                # Helpers (colombian holidays algorithm, EXIF extraction)
├── frontend/src/
│   ├── main.jsx              # React root render + PWA registration
│   ├── App.jsx               # Router: PWA routes vs /admin/* routes
│   ├── pages/                # Page components (InspectionForm, AdminDashboard, etc.)
│   ├── components/           # Shared Mantine UI components
│   └── services/             # API client functions
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production (healthchecks, restart policies, memory limits)
├── .env                      # Credentials (git-ignored)
└── .env.example              # Template with descriptions, no secrets
```

## Key Technical Decisions

- **API prefix**: All routes under `/api/v1/`. Never create routes outside this prefix.
- **Timezone**: All timestamps stored as UTC in PostgreSQL. Conversion to `America/Bogota` (UTC-5) happens in application layer only. The `inspection_date` column is type DATE calculated from local Bogota time at submission.
- **Unique constraint**: Inspections are unique per `cedula + placa + fecha` (collaborator_id + plate + inspection_date). Never by name.
- **Cedula as identifier**: The cedula (national ID number) is the primary unique identifier for collaborators, not the name. Auto-registration creates collaborator records from PWA submissions.
- **No emojis**: Absolutely no emojis anywhere in UI, emails, WhatsApp messages, logs, or comments. This is a hard business rule.
- **Viewport detection for admin**: Use CSS/JS viewport width check (min 1024px), never user-agent sniffing. Show warning but don't hard-block on mobile.
- **Auth**: Admin login via magic links sent through Resend API (15-min expiry token). JWT for session. No passwords anywhere.
- **Photo storage**: Local volume `./uploads:/app/uploads` with path structure `uploads/{year}/{month}/{cedula}_{placa}/{filename}`. 90-day retention policy with daily cleanup job at 2:00 AM Bogota time.

## Environment Variables

Backend reads via `dotenv`; frontend reads `VITE_*` prefixed vars at build time.

Required backend vars:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing JWT tokens
- `RESEND_API_KEY` — Resend email API key
- `RESEND_FROM_EMAIL` — Sender email for magic links and reports
- `WHATSAPP_PHONE_NUMBER_ID` — Meta Cloud API phone number ID
- `WHATSAPP_ACCESS_TOKEN` — Meta Cloud API access token
- `WHATSAPP_TEMPLATE_NAME` — WhatsApp template name (default: `alerta_inspeccion_pendiente`)
- `APP_URL` — Base URL for magic link redirects

Required frontend vars:
- `VITE_API_URL` — Backend URL (`http://backend_node:3000` in Docker, `http://localhost:3006` for local dev)

## Database Schema (Core Tables)

- `admin_users` — id, email, role (superadmin/admin), name, is_active
- `collaborators` — id, cedula (UNIQUE), first_name, last_name, phone, is_active
- `collaborator_vehicles` — id, collaborator_id (FK), plate, vehicle_type (auto/moto/null)
- `sections` — id, vehicle_type, name, display_order, is_active
- `questions` — id, section_id (FK), text, is_other (boolean), display_order, is_active
- `photo_configs` — id, vehicle_type, label, is_required, display_order, is_active
- `inspections` — id, collaborator_id (FK), plate, vehicle_type, inspection_date (DATE). UNIQUE(collaborator_id, plate, inspection_date)
- `inspection_answers` — id, inspection_id (FK), question_id (FK), answer (bueno/malo/null), observations
- `inspection_photos` — id, inspection_id (FK), photo_config_id (FK), file_path, exif_date, exif_lat, exif_lng, exif_available
- `holiday_overrides` — id, date (UNIQUE), action (add/remove), description
- `app_settings` — key (PK), value, updated_at
- `whatsapp_alerts_log` — id, collaborator_id, plate, days_count, sent_at

## API Endpoints Reference

### Public (no auth, used by PWA)

```
GET  /api/v1/inspection-status?cedula=X&placa=Y   # Day status check (must call before showing form)
GET  /api/v1/sections?vehicle_type=auto|moto       # Active sections + questions
GET  /api/v1/photo-config?vehicle_type=auto|moto   # Required photo config
POST /api/v1/inspections                           # Submit form (multipart/form-data)
GET  /api/v1/holidays?year=YYYY                    # Holiday list for year
GET  /api/v1/health                                # Health check
```

### Private (JWT required, admin panel)

```
POST /api/v1/auth/magic-link                       # Send magic link email
POST /api/v1/auth/verify                           # Verify magic link token -> JWT
GET  /api/v1/auth/me                               # Current admin user

# CRUD endpoints for all admin-managed entities:
/api/v1/admin/collaborators      (GET, POST, PUT, DELETE + POST /import-csv)
/api/v1/admin/sections           (GET, POST, PUT, DELETE)
/api/v1/admin/questions          (GET, POST, PUT, DELETE)
/api/v1/admin/photo-configs      (GET, POST, PUT, DELETE)
/api/v1/admin/users              (GET, POST, PUT, DELETE) — superadmin only
/api/v1/admin/holiday-overrides  (GET, POST, DELETE) — superadmin only
/api/v1/admin/settings           (GET, PUT)

GET  /api/v1/admin/inspections          # Filtered list with pagination
GET  /api/v1/admin/inspections/export   # Excel/CSV export
GET  /api/v1/admin/dashboard            # Summary stats
GET  /api/v1/admin/alerts               # Collaborators above inactivity threshold
```

## Business Logic Rules

### Vehicle type detection by plate

- `ABC123` (3 letters + 3 numbers) = auto
- `ABC12D` (3 letters + 2 numbers + 1 letter) = moto
- Other formats: prompt user to select manually

### Photo requirements

- Photos required on first business Monday of each week (or Tuesday if Monday is holiday)
- First-time registration (new cedula+placa combo): always require photos regardless of day
- Blocking: if photos weren't submitted on the required day, form stays blocked rest of the week until photos are submitted
- Block operates per cedula+placa combination
- Validation: MIME check, min 640x480px, min 100KB, EXIF metadata extraction (date + GPS)
- Default photos — moto: 2 (left side, right side); auto: 4 (front, back, left, right)
- Configurable by admin per vehicle type

### Colombian holidays (Ley 51 de 1983 / Ley Emiliani)

Calculated algorithmically, not from a static table. Includes:
- Fixed holidays (Jan 1, May 1, Jul 20, Aug 7, Dec 8, Dec 25)
- Easter-dependent (Holy Thursday, Good Friday, Ascension, Corpus Christi, Sacred Heart)
- Emiliani-shifted to Monday (Jan 6, Mar 19, Jun 29, Aug 15, Oct 12, Nov 1, Nov 11)
- Override table in DB for extraordinary additions/removals by superadmin

Business days = Monday through Saturday, excluding holidays and Sundays.

### Daily email report (Resend)

- Sent at 8:00 AM Bogota time on business days (Mon-Sat, excluding holidays)
- Contains previous business day's complete inspection data as .xlsx attachment
- Body includes summary: total forms, missing collaborators, pending photo alerts

### WhatsApp alerts (Meta Cloud API)

- Check runs daily at 11:00 AM Bogota time on business days
- Alerts when active collaborator exceeds threshold of consecutive business days without inspection (default: 6)
- Alert sent once per threshold crossing (at 6, 12, 18 days, etc. — not daily)
- Template: `alerta_inspeccion_pendiente` with params: name, cedula, days_count, plate
- Logged in `whatsapp_alerts_log` to prevent duplicates

### Photo retention

- Photos kept for 90 days
- Cleanup job runs daily at 2:00 AM Bogota time, deletes files older than 90 days

## Docker Networking

Services communicate by container name on an internal Docker network:
- `base_de_datos_postgresql` — PostgreSQL
- `backend_node` — Express API
- `frontend_nginx` — Nginx serving React build

## Coding Conventions

- All backend code in `backend/src/`, all frontend code in `frontend/src/`
- Use Mantine UI components exclusively (no raw HTML forms, no other UI libraries)
- Validate in both frontend and backend (plate format, required fields, photos, dates)
- API documented with Swagger/OpenAPI at `/api/v1/docs`
- No `node_modules/` in repo; `npm install` runs inside Docker build
- Binary dependencies (sharp, exiftool) installed in Dockerfile, never host-level
