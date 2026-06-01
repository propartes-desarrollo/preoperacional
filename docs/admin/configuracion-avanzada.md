# Configuracion Avanzada

**Sistema Preoperacional Propartes — Version 1.1**

---

## Parametros configurables desde el panel (app_settings)

Accesibles en el panel de administracion > **Configuracion** (solo superadmin).

| Clave | Valor por defecto | Descripcion | Validacion |
|---|---|---|---|
| `whatsapp_alert_threshold` | `6` | Dias habiles consecutivos sin inspeccion para enviar alerta de inactividad por correo | Entero entre 1 y 365 |
| `whatsapp_reminder_time` | `07:55` | Hora de envio del recordatorio WhatsApp en zona Bogota | Formato HH:MM (00:00 a 23:59) |

Los cambios en `app_settings` surten efecto inmediatamente sin reiniciar el servidor.

---

## Variables de entorno (archivo .env)

Estas variables se configuran en el servidor antes de iniciar Docker. Requieren reinicio del backend para aplicarse.

### Base de datos

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `POSTGRES_USER` | Usuario de PostgreSQL | `preoperacional_user` |
| `POSTGRES_PASSWORD` | Contrasena de PostgreSQL | Cadena aleatoria segura |
| `POSTGRES_DB` | Nombre de la base de datos | `preoperacional_db` |
| `DATABASE_URL` | URL de conexion completa | `postgresql://user:pass@base_de_datos_postgresql:5432/db` |

### Seguridad

| Variable | Descripcion | Como generar |
|---|---|---|
| `JWT_SECRET` | Secreto para firmar tokens JWT | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Duracion de la sesion admin | `7d` (por defecto) |

### URLs y CORS

| Variable | Descripcion | Ejemplo produccion |
|---|---|---|
| `APP_URL` | URL publica de la aplicacion | `https://preoperacional.sudominio.com` |
| `CORS_ORIGIN` | Origenes permitidos (separados por coma) | `https://preoperacional.sudominio.com` |
| `VITE_API_URL` | URL del backend que usa el navegador | `https://preoperacional.sudominio.com/api/v1` |

### Correo (Resend)

| Variable | Descripcion |
|---|---|
| `RESEND_API_KEY` | API key de Resend (empieza con `re_`) |
| `RESEND_FROM_EMAIL` | Correo remitente (debe estar verificado en Resend) |

### WhatsApp (Meta Cloud API)

| Variable | Descripcion |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | ID del numero de telefono en Meta Business |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso del sistema (preferiblemente permanente) |
| `WHATSAPP_REMINDER_TEMPLATE_NAME` | Nombre de la plantilla aprobada (default: `recordatorio_preoperacional`) |

### Almacenamiento

| Variable | Descripcion | Default |
|---|---|---|
| `UPLOADS_DIR` | Ruta interna donde se guardan las fotos | `/app/uploads` |
| `PHOTO_RETENTION_DAYS` | Dias de retencion de fotos | `90` |

### Seed inicial

| Variable | Descripcion |
|---|---|
| `INITIAL_SUPERADMIN_EMAIL` | Correo del primer superadmin (solo se usa en instalacion inicial) |
| `INITIAL_SUPERADMIN_NAME` | Nombre del primer superadmin |

### Desarrollo

| Variable | Descripcion | Produccion |
|---|---|---|
| `NODE_ENV` | Entorno de ejecucion | `production` |
| `ENABLE_DEBUG_ENDPOINTS` | Habilita endpoints de debug | `false` o no definir |

---

## Configuracion de la plantilla de WhatsApp

La plantilla `recordatorio_preoperacional` debe estar aprobada en Meta Business Manager antes de que el sistema pueda enviar mensajes.

**Parametros de la plantilla:**

| Parametro | Variable de la plantilla | Valor enviado |
|---|---|---|
| Nombre del colaborador | `{{1}}` (cuerpo del mensaje) | `first_name` del colaborador |
| Enlace al formulario | Boton CTA | URL fija configurada en la plantilla aprobada |

Si necesita usar una plantilla con nombre diferente, cambie `WHATSAPP_REMINDER_TEMPLATE_NAME` en el `.env`.

---

## Configuracion de rotacion de logs

En produccion, los logs de Docker estan limitados por `docker-compose.prod.yml`:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

Cada contenedor puede tener hasta 30 MB de logs (3 archivos de 10 MB). Si necesita logs mas extensos para auditoria, considere usar el driver `syslog` o `fluentd` para enviarlos a un sistema centralizado.

---

## Configuracion del rate limiting

Definido en `backend/src/index.js`:

| Limite | Ventana | Endpoints |
|---|---|---|
| 100 requests | 60 segundos | Global (todos los endpoints) |
| 30 requests | 60 segundos | `/api/v1/inspection-status` (mas restrictivo) |

Para ajustar estos valores se requiere modificar el codigo fuente y reconstruir el contenedor.

---

## Configuracion de retencion de fotos

El job `photoCleanupJob` elimina fotos con mas de `PHOTO_RETENTION_DAYS` dias cada noche a las 2:00 AM (Bogota). Para cambiar el periodo de retencion:

1. Editar `PHOTO_RETENTION_DAYS` en el `.env`.
2. Reiniciar el backend: `docker-compose -f docker-compose.prod.yml up -d backend_node`.

> El valor en `app_settings.photo_retention_days` es de referencia. El valor efectivo es la variable de entorno.
