# Registros (Logs)

**Sistema Preoperacional Propartes — Version 1.1**

---

## Ubicacion de los logs

El backend utiliza **Pino**, un logger estructurado en formato JSON. Los logs van a la salida estandar del contenedor y Docker los captura automaticamente.

| Servicio | Como acceder |
|---|---|
| Backend (API + jobs) | `docker logs backend_node` |
| Base de datos | `docker logs base_de_datos_postgresql` |
| Frontend (Nginx) | `docker logs frontend_nginx` |

Los archivos de log de Docker se encuentran en el servidor host en:
```
/var/lib/docker/containers/<container_id>/<container_id>-json.log
```

En produccion, cada contenedor tiene rotacion automatica: maxima 10 MB por archivo, 3 archivos (30 MB total por contenedor).

---

## Niveles de log

| Nivel | Codigo numerico | Descripcion |
|---|---|---|
| trace | 10 | Informacion muy detallada (no se usa en produccion) |
| debug | 20 | Informacion de depuracion |
| info | 30 | Eventos normales del sistema |
| warn | 40 | Situaciones inusuales que no son error |
| error | 50 | Errores que afectan una operacion |
| fatal | 60 | Errores criticos que detienen el proceso |

---

## Formato de los logs

Cada linea es un objeto JSON. Ejemplo:

```json
{
  "level": 30,
  "time": 1748812345678,
  "pid": 1,
  "hostname": "backend_node",
  "component": "dailyReminder",
  "total": 15,
  "msg": "Enviando recordatorios a 15 colaboradores."
}
```

Para leer los logs en formato legible (requiere `pino-pretty` o `jq`):

```bash
# Con jq (disponible en Ubuntu)
docker logs backend_node --tail=100 | grep '^{' | jq '.'

# Solo errores
docker logs backend_node | grep '"level":50' | jq '.'

# Solo un componente especifico
docker logs backend_node | grep '"component":"dailyReminder"' | jq '.'
```

---

## Campos del log por componente

| Campo `component` | Descripcion |
|---|---|
| `db` | Conexion a la base de datos |
| `migrate` | Ejecucion de migraciones |
| `seed` | Seed inicial de datos |
| `backend` | Inicio del servidor Express |
| `inspection` | Envio de formularios de inspeccion |
| `collaborator` | Registro o actualizacion de colaboradores |
| `dailyReminder` | Job de recordatorios WhatsApp |
| `inactivityAlert` | Job de alertas de inactividad |
| `dailyReport` | Job de reporte diario por correo |
| `photoCleanup` | Job de limpieza de fotos |
| `cleanupTokens` | Job de limpieza de tokens expirados |

---

## Ejemplos de logs por situacion

### Inicio normal del sistema

```json
{"level":30,"component":"db","msg":"PostgreSQL disponible."}
{"level":30,"component":"migrate","msg":"3 migracion(es) aplicada(s)."}
{"level":30,"component":"seed","msg":"Seed omitido (datos existentes)."}
{"level":30,"component":"dailyReminder","msg":"Job de recordatorios diarios registrado (hora configurable desde panel admin)."}
{"level":30,"component":"inactivityAlert","msg":"Job de alerta de inactividad registrado (11:00 AM Bogota)."}
{"level":30,"component":"backend","msg":"Puerto: 3000 | Entorno: production | Version: 1.1.0"}
```

### Inspeccion registrada exitosamente

```json
{"level":30,"component":"inspection","inspectionId":42,"cedula":"12345678","plate":"ABC123","photos":2,"msg":"Inspeccion registrada."}
```

### Recordatorio WhatsApp enviado

```json
{"level":30,"component":"dailyReminder","time":"07:55","msg":"Iniciando job de recordatorios diarios."}
{"level":30,"component":"dailyReminder","total":18,"msg":"Enviando recordatorios a 18 colaboradores."}
{"level":30,"component":"whatsapp","to":"+573001234567","template":"recordatorio_preoperacional","msg":"Recordatorio enviado a Juan"}
{"level":30,"component":"dailyReminder","sent":17,"failed":1,"msg":"Recordatorios completados: 17 exitosos, 1 fallidos."}
```

### Error de WhatsApp por token invalido

```json
{"level":50,"component":"whatsapp","err":"Invalid OAuth access token - Cannot parse access token","msg":"Error enviando WhatsApp"}
```

### Fallo en migracion

```json
{"level":60,"component":"migrate","msg":"Fallo migracion \"015_add_inspection_frequency\": column already exists"}
```

---

## Consulta de logs historicos

Los logs de Docker persisten hasta que el contenedor es eliminado o hasta que la rotacion los borra. Para exportar logs:

```bash
# Exportar todos los logs del backend del dia de hoy
docker logs backend_node --since "2026-06-01T00:00:00" > logs_backend_20260601.txt

# Exportar solo errores
docker logs backend_node 2>&1 | grep '"level":5[0-9]' > errores_backend.txt
```

---

## Monitoreo de logs en tiempo real

```bash
# Ver logs de todos los servicios en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend en tiempo real
docker logs backend_node -f

# Solo errores en tiempo real
docker logs backend_node -f | grep --line-buffered '"level":5'
```
