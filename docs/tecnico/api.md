# Referencia de API

**Sistema Preoperacional Propartes — Version 1.1**  
**Base URL:** `https://preoperacional.sudominio.com/api/v1`  
**Documentacion interactiva:** `https://preoperacional.sudominio.com/api/v1/docs`

---

## Autenticacion

Los endpoints privados requieren un JWT en el header:

```
Authorization: Bearer <token>
```

El token se obtiene tras verificar un magic link (ver seccion de Auth).

---

## Codigos de respuesta generales

| Codigo | Significado |
|---|---|
| 200 | Exito |
| 201 | Recurso creado |
| 400 | Error de validacion (ver campo `error` en el body) |
| 401 | No autenticado o token expirado |
| 403 | Sin permisos (se requiere superadmin) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: inspeccion duplicada) |
| 422 | Error de procesamiento (ej: foto invalida) |
| 429 | Rate limit excedido (100 req/min global) |
| 500 | Error interno del servidor |

---

## Endpoints publicos (sin autenticacion)

### GET /health

Verifica que el sistema esta operativo.

**Respuesta:**
```json
{ "status": "ok", "db": "connected" }
```

---

### GET /inspection-status

Verifica el estado del dia para una cedula y placa antes de mostrar el formulario.

**Query params:**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `cedula` | string | Cedula del colaborador |
| `placa` | string | Placa del vehiculo |

**Respuesta exitosa (200):**
```json
{
  "can_submit": true,
  "already_submitted": false,
  "is_business_day": true,
  "photos_required": false,
  "photos_blocked": false,
  "vehicle_type": "moto",
  "collaborator_exists": true
}
```

---

### GET /sections

Retorna las secciones y preguntas activas para un tipo de vehiculo.

**Query params:** `vehicle_type=auto|moto`

**Respuesta:**
```json
{
  "sections": [
    {
      "id": 1,
      "name": "Elementos de Proteccion Personal",
      "display_order": 1,
      "questions": [
        { "id": 1, "text": "Guantes, Casco...", "is_other": false, "display_order": 1 }
      ]
    }
  ]
}
```

---

### GET /photo-config

Retorna la configuracion de fotos requeridas por tipo de vehiculo.

**Query params:** `vehicle_type=auto|moto`

**Respuesta:**
```json
{
  "configs": [
    { "id": 1, "label": "Costado izquierdo", "is_required": true, "display_order": 1 }
  ]
}
```

---

### POST /inspections

Envia un formulario de inspeccion completo con fotos.

**Content-Type:** `multipart/form-data`

**Campos del form:**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `cedula` | string | Si | Cedula del colaborador |
| `nombre` | string | Si | Nombre |
| `apellidos` | string | Si | Apellidos |
| `placa` | string | Si | Placa del vehiculo |
| `vehicle_type` | string | Si | `auto` o `moto` |
| `answers` | string (JSON) | Si | Array de respuestas serializado |
| `photo_<id>` | file | Condicional | Foto para cada `photo_config_id` |

**Estructura de `answers`:**
```json
[
  { "question_id": 1, "answer": "bueno", "observations": null },
  { "question_id": 2, "answer": "malo", "observations": "Frenos desgastados" },
  { "question_id": 3, "answer": null, "observations": "Observacion libre" }
]
```

**Respuesta exitosa (201):**
```json
{
  "inspection_id": 42,
  "inspection_date": "2026-06-01",
  "collaborator_id": 7,
  "photos_uploaded": 2,
  "message": "Inspeccion registrada correctamente"
}
```

---

### GET /holidays

Retorna los festivos calculados para un ano.

**Query params:** `year=2026`

**Respuesta:**
```json
{
  "holidays": ["2026-01-01", "2026-01-12", "2026-03-23", "..."]
}
```

---

## Endpoints de autenticacion

### POST /auth/magic-link

Solicita un enlace de acceso por correo.

**Body:**
```json
{ "email": "admin@sudominio.com" }
```

**Respuesta (200):**
```json
{ "message": "Enlace de acceso enviado" }
```

---

### POST /auth/verify

Verifica el token del magic link y retorna un JWT.

**Body:**
```json
{ "token": "uuid-del-enlace" }
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "email": "admin@...", "name": "Admin", "role": "superadmin" }
}
```

---

### GET /auth/me

Retorna el usuario autenticado actual.

**Header:** `Authorization: Bearer <token>`

**Respuesta (200):**
```json
{ "id": 1, "email": "admin@...", "name": "Admin", "role": "superadmin" }
```

---

## Endpoints privados — Admin

> Todos requieren `Authorization: Bearer <token>`. Los marcados con (*) requieren rol `superadmin`.

### GET /admin/dashboard

Resumen del dia actual.

**Respuesta:**
```json
{
  "today": "2026-06-01",
  "is_business_day": true,
  "is_photo_day": false,
  "inspections_today": 15,
  "inspections_today_daily": 12,
  "inspections_today_eventual": 3,
  "active_collaborators_total": 20,
  "active_collaborators_daily": 16,
  "active_collaborators_eventual": 4,
  "missing_today": [
    { "collaborator_id": 5, "cedula": "12345678", "name": "Juan Perez", "plate": "ABC123", "inspection_frequency": "daily" }
  ],
  "inspections_last_7_days": [
    { "date": "2026-05-26", "count": 14 }
  ]
}
```

---

### GET /admin/collaborators

Lista colaboradores con paginacion y filtros.

**Query params:** `search`, `is_active`, `frequency`, `page` (default 1), `limit` (default 50, max 200)

---

### POST /admin/collaborators

Crea un colaborador.

**Body:**
```json
{
  "cedula": "12345678",
  "first_name": "Juan",
  "last_name": "Perez",
  "phone": "3001234567",
  "is_active": true,
  "inspection_frequency": "daily",
  "vehicles": [
    { "plate": "ABC123", "vehicle_type": "auto" }
  ]
}
```

---

### POST /admin/collaborators/import-csv

Importa colaboradores masivamente desde CSV.

**Content-Type:** `multipart/form-data`  
**Campo:** `file` (archivo CSV)

---

### GET /admin/inspections

Lista inspecciones con filtros y paginacion.

**Query params:** `cedula`, `plate`, `date_from`, `date_to`, `vehicle_type`, `page`, `limit`

---

### GET /admin/inspections/export

Exporta inspecciones a Excel (.xlsx) con los mismos filtros que el listado.

**Respuesta:** Archivo binario `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

### GET /admin/alerts

Lista colaboradores activos de frecuencia diaria que superan el umbral de inactividad.

---

### GET /admin/settings

Retorna todos los parametros configurables del sistema.

---

### PUT /admin/settings

Actualiza uno o varios parametros. Solo se permiten las claves: `whatsapp_alert_threshold`, `whatsapp_reminder_time`.

**Body:**
```json
{
  "settings": [
    { "key": "whatsapp_alert_threshold", "value": "8" },
    { "key": "whatsapp_reminder_time", "value": "08:00" }
  ]
}
```

---

### GET /admin/users (*superadmin)
### POST /admin/users (*superadmin)
### PUT /admin/users/:id (*superadmin)
### DELETE /admin/users/:id (*superadmin)

CRUD de usuarios administradores. El rol puede ser `admin` o `superadmin`.

---

### GET /admin/holiday-overrides (*superadmin)
### POST /admin/holiday-overrides (*superadmin)
### DELETE /admin/holiday-overrides/:id (*superadmin)

Gestion de festivos extraordinarios. `action` puede ser `add` (agregar festivo) o `remove` (quitar un festivo calculado).
