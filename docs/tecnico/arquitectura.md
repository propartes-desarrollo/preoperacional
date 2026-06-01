# Arquitectura del Sistema

**Sistema Preoperacional Propartes — Version 1.1**

---

## Diagrama de componentes

```
Internet
   |
   |  HTTPS (puerto 80/443)
   v
+---------------------------+
|   frontend_nginx          |  React 19 + Mantine UI
|   (Nginx, puerto 80)      |  Build estatico servido por Nginx
|   PWA + Panel Admin       |  Proxy /api/* → backend_node
+---------------------------+
           |
           | HTTP interno (Docker network)
           | http://backend_node:3000
           v
+---------------------------+
|   backend_node            |  Node.js 20 + Express 5
|   (Express, puerto 3000)  |  API REST /api/v1/*
|                           |  Cron jobs internos
+---------------------------+
           |
           | TCP (Docker network)
           v
+---------------------------+
|   base_de_datos_postgresql|  PostgreSQL 16
|   (puerto 5432)           |  Datos persistidos en volumen Docker
+---------------------------+

Servicios externos:
+---------------------------+
|   Resend API              |  Correos transaccionales
|   (HTTPS)                 |  Magic links + reportes diarios
+---------------------------+
+---------------------------+
|   Meta Cloud API v25.0    |  WhatsApp Business
|   (HTTPS)                 |  Recordatorios diarios
+---------------------------+
```

---

## Flujo de datos — Colaborador (PWA)

```
Celular del colaborador
   |
   | 1. GET /api/v1/inspection-status?cedula=X&placa=Y
   |    Verifica: dia habil, inspeccion duplicada, fotos requeridas
   v
Backend verifica en PostgreSQL
   |
   | 2. GET /api/v1/sections?vehicle_type=auto
   |    GET /api/v1/photo-config?vehicle_type=auto
   |    Carga preguntas y configuracion de fotos
   v
Colaborador llena el formulario
   |
   | 3. POST /api/v1/inspections (multipart/form-data)
   |    Datos: cedula, nombre, placa, vehicle_type, answers[], photo_N
   v
Backend:
  - Valida campos y fotos (MIME, tamano, resolucion, EXIF)
  - Crea o actualiza colaborador por cedula
  - Inserta inspeccion, respuestas y fotos en PostgreSQL
  - Guarda archivos en volumen /app/uploads/{year}/{month}/{cedula}_{placa}/
   |
   | 201 Created
   v
Respuesta al colaborador
```

---

## Flujo de datos — Administrador

```
Navegador del admin
   |
   | 1. POST /api/v1/auth/magic-link { email }
   |    Backend llama a Resend API, envia correo con token
   v
Admin recibe correo → hace clic en enlace
   |
   | 2. POST /api/v1/auth/verify { token }
   |    Backend valida token (15 min expiry), emite JWT (7 dias)
   v
Admin usa el panel (JWT en header Authorization: Bearer <token>)
   |
   | GET /api/v1/admin/dashboard
   | GET /api/v1/admin/collaborators
   | GET /api/v1/admin/inspections
   | PUT /api/v1/admin/settings
   | etc.
   v
Backend valida JWT en cada peticion → responde con datos
```

---

## Jobs automaticos (Cron)

| Job | Horario | Funcion |
|---|---|---|
| `dailyReminderJob` | Cada minuto (evalua hora configurada) | Envia WhatsApp a colaboradores activos de frecuencia diaria |
| `inactivityAlertJob` | 16:00 UTC (11:00 AM Bogota) | Envia email con colaboradores inactivos a admins |
| `dailyReportJob` | 13:00 UTC (8:00 AM Bogota) | Envia reporte Excel del dia anterior por correo |
| `cleanupTokensJob` | Cada hora | Elimina magic link tokens expirados |
| `photoCleanupJob` | 07:00 UTC (2:00 AM Bogota) | Elimina fotos con mas de 90 dias |

---

## Estructura de carpetas del proyecto

```
preoperacional_propartes/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Entry point, bootstrap, middlewares
│       ├── db.js                 # Pool de conexiones PostgreSQL (pg)
│       ├── migrate.js            # Runner de migraciones
│       ├── seed.js               # Datos iniciales
│       ├── swagger.js            # Configuracion OpenAPI
│       ├── migrations/           # 001 a 015 — SQL como JS
│       ├── routes/
│       │   ├── health.js
│       │   ├── auth.js           # Magic link + verify + me
│       │   ├── inspections.js    # POST /inspections (publico)
│       │   ├── inspectionStatus.js
│       │   ├── sections.js
│       │   ├── photoConfig.js
│       │   ├── holidays.js
│       │   └── admin/
│       │       ├── dashboard.js
│       │       ├── collaborators.js
│       │       ├── inspections.js
│       │       ├── sections.js
│       │       ├── questions.js
│       │       ├── photoConfigs.js
│       │       ├── adminUsers.js
│       │       ├── holidayOverrides.js
│       │       ├── settings.js
│       │       └── alerts.js
│       ├── middleware/
│       │   ├── requireAuth.js    # Valida JWT
│       │   └── requireSuperadmin.js
│       ├── services/
│       │   ├── authService.js    # JWT sign/verify, magic link
│       │   ├── collaboratorService.js
│       │   ├── emailService.js   # Resend API
│       │   ├── whatsappService.js # Meta Cloud API
│       │   ├── alertService.js
│       │   ├── photoBlockService.js
│       │   ├── businessDayService.js
│       │   └── exifService.js
│       ├── jobs/
│       │   ├── dailyReminderJob.js
│       │   ├── inactivityAlertJob.js
│       │   ├── dailyReportJob.js
│       │   ├── photoCleanupJob.js
│       │   └── cleanupTokens.js
│       └── utils/
│           ├── logger.js         # Pino logger
│           ├── dateHelpers.js    # Timezone Bogota
│           ├── plateDetector.js  # Deteccion auto/moto
│           └── validators.js     # Zod schemas
├── frontend/
│   ├── Dockerfile                # Multi-stage: dev (Vite) / prod (Nginx)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # React root + PWA registration
│       ├── App.jsx               # Router PWA vs /admin/*
│       ├── pages/
│       │   ├── InspectionForm.jsx
│       │   └── admin/
│       │       ├── DashboardPage.jsx
│       │       ├── CollaboratorsPage.jsx
│       │       ├── InspectionsPage.jsx
│       │       ├── SettingsPage.jsx
│       │       └── ...
│       ├── components/           # Componentes Mantine reutilizables
│       └── api/
│           └── adminApi.js       # Funciones axios hacia el backend
├── docker-compose.yml            # Desarrollo
├── docker-compose.prod.yml       # Produccion
├── .env                          # Variables de entorno (git-ignored)
└── .env.example                  # Plantilla de variables
```

---

## Decisiones de diseno relevantes

| Decision | Razon |
|---|---|
| Sin login por contrasena para colaboradores | Reduccion de friccion en campo. Solo cedula + placa. |
| Magic link para administradores | Seguridad sin gestionar contrasenas. Token de un solo uso con expiry. |
| Cedula como identificador unico | El nombre puede cambiar (errores de digitacion, actualizacion). La cedula es inmutable. |
| Timestamps en UTC, conversion en app | PostgreSQL almacena todo en UTC. La conversion a America/Bogota ocurre solo en la capa de aplicacion. |
| Constraint UNIQUE (collaborator_id, plate, inspection_date) | Previene duplicados a nivel de base de datos como segunda linea de defensa. |
| Cron por minuto con lookup de hora en DB | Permite cambiar la hora de envio desde el panel sin reiniciar el servidor. |
| Multipart/form-data para inspecciones | Permite enviar fotos y datos del formulario en una sola peticion. |
