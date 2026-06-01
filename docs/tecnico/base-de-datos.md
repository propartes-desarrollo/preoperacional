# Base de Datos

**Sistema Preoperacional Propartes — Version 1.1**  
**Motor:** PostgreSQL 16  
**Zona horaria de almacenamiento:** UTC (conversion a America/Bogota en la aplicacion)

---

## Diagrama entidad-relacion (simplificado)

```
admin_users
    |
    | (magic_link_tokens.admin_user_id)
    |
magic_link_tokens

collaborators
    |-- collaborator_vehicles (collaborator_id FK)
    |
    |-- inspections (collaborator_id FK)
          |
          |-- inspection_answers (inspection_id FK)
          |         |
          |         +-- questions (question_id FK)
          |                 |
          |                 +-- sections (section_id FK)
          |
          |-- inspection_photos (inspection_id FK)
                    |
                    +-- photo_configs (photo_config_id FK)

holiday_overrides  (tabla independiente)
app_settings       (tabla independiente, clave-valor)
whatsapp_alerts_log (collaborator_id FK)
```

---

## Diccionario de datos

### admin_users

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | Identificador interno |
| email | VARCHAR(255) UNIQUE NOT NULL | Correo electronico del administrador |
| name | VARCHAR(255) NOT NULL | Nombre completo |
| role | VARCHAR(20) NOT NULL | `admin` o `superadmin` |
| is_active | BOOLEAN DEFAULT true | Estado de la cuenta |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Fecha de creacion |

---

### magic_link_tokens

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| token | UUID UNIQUE NOT NULL | Token del enlace de acceso |
| admin_user_id | INT FK (admin_users) | |
| expires_at | TIMESTAMPTZ NOT NULL | Expiracion del token (15 min desde creacion) |
| used_at | TIMESTAMPTZ | Fecha de uso (null si no se ha usado) |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

---

### collaborators

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| cedula | VARCHAR(20) UNIQUE NOT NULL | Cedula de ciudadania (identificador unico) |
| first_name | VARCHAR(100) NOT NULL | Nombre |
| last_name | VARCHAR(100) NOT NULL | Apellido |
| phone | VARCHAR(20) | Telefono celular (para WhatsApp) |
| is_active | BOOLEAN DEFAULT true | Si el colaborador esta activo |
| inspection_frequency | VARCHAR(10) NOT NULL DEFAULT 'daily' | `daily` o `eventual` |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

**Constraint:** `cedula` es UNIQUE. El sistema hace upsert por cedula en cada envio del PWA.

---

### collaborator_vehicles

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| collaborator_id | INT FK (collaborators) NOT NULL | |
| plate | VARCHAR(10) NOT NULL | Placa normalizada en mayusculas |
| vehicle_type | VARCHAR(10) | `auto`, `moto` o NULL |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

**Constraint:** UNIQUE (collaborator_id, plate)

---

### sections

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| vehicle_type | VARCHAR(10) NOT NULL | `auto` o `moto` |
| name | VARCHAR(255) NOT NULL | Nombre de la seccion |
| display_order | INT NOT NULL | Orden de visualizacion |
| is_active | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

---

### questions

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| section_id | INT FK (sections) NOT NULL | |
| text | TEXT NOT NULL | Texto de la pregunta |
| is_other | BOOLEAN DEFAULT false | Si es la pregunta de texto libre "Otro - Cual" |
| display_order | INT NOT NULL | Orden dentro de la seccion |
| is_active | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

---

### photo_configs

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| vehicle_type | VARCHAR(10) NOT NULL | `auto` o `moto` |
| label | VARCHAR(100) NOT NULL | Etiqueta de la foto (ej: "Frontal") |
| is_required | BOOLEAN DEFAULT true | Si es obligatoria en dias de fotos |
| display_order | INT NOT NULL | |
| is_active | BOOLEAN DEFAULT true | |

---

### inspections

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| collaborator_id | INT FK (collaborators) NOT NULL | |
| plate | VARCHAR(10) NOT NULL | Placa inspeccionada |
| vehicle_type | VARCHAR(10) | `auto` o `moto` |
| inspection_date | DATE NOT NULL | Fecha en zona Bogota |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Timestamp UTC del envio |

**Constraint UNIQUE:** (collaborator_id, plate, inspection_date) — previene duplicados.

---

### inspection_answers

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| inspection_id | INT FK (inspections) NOT NULL | |
| question_id | INT FK (questions) NOT NULL | |
| answer | VARCHAR(10) | `bueno`, `malo` o NULL |
| observations | TEXT | Observacion libre (requerida si answer = malo) |

---

### inspection_photos

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| inspection_id | INT FK (inspections) NOT NULL | |
| photo_config_id | INT FK (photo_configs) NOT NULL | |
| file_path | VARCHAR(500) NOT NULL | Ruta relativa desde `/app/uploads/` |
| original_filename | VARCHAR(255) | Nombre original del archivo |
| mime_type | VARCHAR(100) | Tipo MIME |
| file_size_bytes | INT | Tamano en bytes |
| exif_date | TIMESTAMPTZ | Fecha extraida del EXIF |
| exif_lat | DECIMAL(10,7) | Latitud GPS extraida del EXIF |
| exif_lng | DECIMAL(10,7) | Longitud GPS extraida del EXIF |
| exif_available | BOOLEAN DEFAULT false | Si se pudo extraer metadata EXIF |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

**Estructura de file_path:** `{year}/{month}/{cedula}_{placa}/{configId}_{timestamp}.{ext}`

---

### holiday_overrides

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| date | DATE UNIQUE NOT NULL | Fecha del festivo o excepcion |
| action | VARCHAR(10) NOT NULL | `add` (agregar festivo) o `remove` (quitar festivo calculado) |
| description | VARCHAR(255) | Descripcion del motivo |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

---

### app_settings

| Columna | Tipo | Descripcion |
|---|---|---|
| key | VARCHAR(100) PK | Clave del parametro |
| value | TEXT NOT NULL | Valor del parametro |
| description | TEXT | Descripcion del parametro |
| updated_at | TIMESTAMPTZ | Ultima actualizacion |

**Valores iniciales:**

| key | value | Descripcion |
|---|---|---|
| `whatsapp_alert_threshold` | `6` | Dias de inactividad para alerta |
| `whatsapp_reminder_time` | `07:55` | Hora de envio del recordatorio |
| `photo_retention_days` | `90` | Dias de retencion de fotos |

---

### whatsapp_alerts_log

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| collaborator_id | INT FK (collaborators) | |
| plate | VARCHAR(10) | |
| days_count | INT | Dias sin inspeccion al momento del envio |
| sent_at | TIMESTAMPTZ DEFAULT NOW() | |

---

### schema_migrations

Tabla interna del sistema de migraciones. No modificar manualmente.

| Columna | Tipo | Descripcion |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(255) UNIQUE | Nombre del archivo de migracion (sin .js) |
| applied_at | TIMESTAMPTZ DEFAULT NOW() | Fecha de aplicacion |

---

## Historial de migraciones

| Archivo | Descripcion |
|---|---|
| 001_create_admin_users | Tabla de administradores |
| 002_create_magic_link_tokens | Tokens de autenticacion |
| 003_create_collaborators | Tabla de colaboradores |
| 004_create_collaborator_vehicles | Vehiculos por colaborador |
| 005_create_sections | Secciones del formulario |
| 006_create_questions | Preguntas del formulario |
| 007_create_photo_configs | Configuracion de fotos |
| 008_create_inspections | Inspecciones |
| 009_create_inspection_answers | Respuestas |
| 010_create_inspection_photos | Fotos adjuntas |
| 011_create_holiday_overrides | Festivos extraordinarios |
| 012_create_app_settings | Configuracion del sistema |
| 013_create_whatsapp_alerts_log | Log de alertas WhatsApp |
| 014_create_updated_at_trigger | Trigger automatico de updated_at |
| 015_add_inspection_frequency | Columna frecuencia en collaborators |

---

## Consultas utiles para soporte

```sql
-- Inspecciones de hoy
SELECT c.cedula, c.first_name, c.last_name, i.plate, i.vehicle_type, i.created_at
FROM inspections i
JOIN collaborators c ON c.id = i.collaborator_id
WHERE i.inspection_date = CURRENT_DATE AT TIME ZONE 'America/Bogota'
ORDER BY i.created_at DESC;

-- Colaboradores activos sin inspeccion hoy
SELECT c.cedula, c.first_name || ' ' || c.last_name AS nombre, cv.plate
FROM collaborators c
JOIN collaborator_vehicles cv ON cv.collaborator_id = c.id
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM inspections i
    WHERE i.collaborator_id = c.id AND i.plate = cv.plate
      AND i.inspection_date = CURRENT_DATE AT TIME ZONE 'America/Bogota'
  )
ORDER BY c.last_name;

-- Migraciones aplicadas
SELECT name, applied_at FROM schema_migrations ORDER BY name;

-- Configuracion actual del sistema
SELECT key, value, description FROM app_settings ORDER BY key;
```
