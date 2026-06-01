# Guia de Desarrollo

**Sistema Preoperacional Propartes — Version 1.1**

---

## Levantar el entorno de desarrollo

### Requisitos

- Docker Engine 24+ y Docker Compose 2+
- Node.js 20 LTS (solo si se trabaja fuera de Docker)
- Git

### Inicio rapido con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio> preoperacional_propartes
cd preoperacional_propartes

# 2. Crear el archivo de entorno para desarrollo
cp .env.example .env
# Editar .env con los valores de desarrollo (ver seccion de variables)

# 3. Levantar todos los servicios
docker-compose up

# 4. Para rebuild (tras cambios en Dockerfile o dependencias)
docker-compose up --build
```

**Servicios disponibles en desarrollo:**

| Servicio | URL |
|---|---|
| Frontend (Vite HMR) | http://localhost:5176 |
| Backend API | http://localhost:3006/api/v1 |
| Docs Swagger | http://localhost:3006/api/v1/docs |
| PostgreSQL | localhost:5432 |

El backend usa `nodemon` en desarrollo: los cambios en `backend/src/` se recargan automaticamente sin reiniciar Docker.

El frontend usa Vite con HMR: los cambios en `frontend/src/` se reflejan en el navegador sin recargar la pagina.

---

### Desarrollo del backend sin Docker

```bash
cd backend
npm install
# Requiere PostgreSQL disponible en localhost:5432
# Ajustar DATABASE_URL en .env para apuntar a localhost
npm start
```

### Desarrollo del frontend sin Docker

```bash
cd frontend
npm install
npm run dev     # Puerto 5173 con proxy al backend
npm run build   # Build de produccion
npm run lint    # ESLint
npm run preview # Vista previa del build
```

---

## Estructura del codigo

Ver [Arquitectura del Sistema](../tecnico/arquitectura.md) para el diagrama completo de carpetas.

### Backend — flujo de una peticion

```
index.js (Express app)
  → middleware (helmet, cors, pino-http, rate-limit)
  → routes/admin/<recurso>.js
      → middleware/requireAuth.js (valida JWT)
      → middleware/requireSuperadmin.js (si aplica)
      → db.js (pool de conexiones a PostgreSQL)
      → services/<servicio>.js (logica de negocio)
      → respuesta JSON
```

### Frontend — estructura de rutas

```
App.jsx
  ├── /              → InspectionForm.jsx (PWA colaborador)
  ├── /admin         → Login con magic link
  ├── /admin/dashboard
  ├── /admin/collaborators
  ├── /admin/inspections
  ├── /admin/sections
  ├── /admin/questions
  ├── /admin/photo-configs
  ├── /admin/holidays
  ├── /admin/users
  └── /admin/settings
```

---

## Migraciones de base de datos

Cada migracion es un archivo en `backend/src/migrations/` con el formato:

```
NNN_descripcion.js
```

Donde `NNN` es el numero secuencial (001, 002, ...).

**Estructura de una migracion:**

```js
// backend/src/migrations/016_ejemplo.js
export async function up(pool) {
  await pool.query(`
    ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS nueva_columna VARCHAR(100)
  `);
}

export async function down(pool) {
  await pool.query(`
    ALTER TABLE collaborators DROP COLUMN IF EXISTS nueva_columna
  `);
}
```

**Ejecutar migraciones manualmente:**

```bash
# Aplicar migraciones pendientes
docker exec -it backend_node node src/migrate-cli.js up

# Revertir la ultima migracion
docker exec -it backend_node node src/migrate-cli.js down
```

Las migraciones tambien se aplican automaticamente al iniciar el backend.

---

## Agregar un nuevo endpoint al API

1. Crear o editar el archivo de rutas en `backend/src/routes/` o `backend/src/routes/admin/`.
2. Registrar el router en `backend/src/index.js`.
3. Si requiere logica de negocio compleja, extraerla a `backend/src/services/`.
4. Agregar el docstring `@openapi` para que aparezca en Swagger.
5. Todos los endpoints van bajo `/api/v1/`. Nunca fuera de este prefijo.

---

## Agregar un nuevo componente de UI

1. Usar exclusivamente componentes de **Mantine UI** (`@mantine/core`).
2. No usar componentes HTML nativos para formularios, tablas o inputs.
3. Los componentes reutilizables van en `frontend/src/components/`.
4. Las paginas van en `frontend/src/pages/admin/` (admin) o `frontend/src/pages/` (PWA).
5. Las llamadas al API van en `frontend/src/api/adminApi.js`.

---

## Cron jobs

Los jobs se registran en `backend/src/index.js` al iniciar el servidor. Cada job es un modulo en `backend/src/jobs/` que exporta una funcion `startXxxJob()`.

Para agregar un nuevo job:

1. Crear `backend/src/jobs/nuevoJob.js`.
2. Exportar `startNuevoJob()`.
3. Importar y llamar en `index.js` despues de los jobs existentes.

---

## Variables de entorno en desarrollo

El archivo `.env` para desarrollo puede usar valores simplificados:

```env
DATABASE_URL=postgresql://preoperacional_user:dev_password@base_de_datos_postgresql:5432/preoperacional_db
JWT_SECRET=dev_secret_no_usar_en_produccion_jamas
APP_URL=http://localhost:5176
CORS_ORIGIN=http://localhost:5176,http://localhost:5173
VITE_API_URL=http://localhost:3006/api/v1
RESEND_API_KEY=re_test_key (o vacio para deshabilitar correos)
INITIAL_SUPERADMIN_EMAIL=dev@localhost.com
INITIAL_SUPERADMIN_NAME=Dev Admin
ENABLE_DEBUG_ENDPOINTS=true
```

Para WhatsApp en desarrollo: dejar las variables vacias. El sistema loga una advertencia pero no falla.

---

## Convenciones de codigo

Ver [Estandares de Codificacion](./estandares.md) para la guia completa.

Resumen rapido:
- ES Modules (`import/export`) en todo el backend y frontend.
- Sin comentarios explicativos salvo que el WHY no sea obvio.
- Sin emojis en ningun archivo (codigo, logs, UI, comentarios).
- Validacion en frontend (Zod) Y en backend (Zod + validacion manual).
- Todos los timestamps en UTC en la DB; conversion a Bogota solo en la app.
- Sin contrasenas en el codigo ni en el repositorio.
