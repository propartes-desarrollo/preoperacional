# Mantenimiento y Monitoreo

**Sistema Preoperacional Propartes — Version 1.1**

---

## Tareas periodicas

### Diarias (automaticas — no requieren intervencion)

| Tarea | Hora (Bogota) | Responsable |
|---|---|---|
| Envio de recordatorio WhatsApp | Configurable (default 7:55 AM) | `dailyReminderJob` |
| Envio de reporte diario por correo | 8:00 AM | `dailyReportJob` |
| Alerta de inactividad por correo | 11:00 AM | `inactivityAlertJob` |
| Limpieza de tokens de magic link expirados | Cada hora | `cleanupTokensJob` |
| Limpieza de fotos antiguas (>90 dias) | 2:00 AM | `photoCleanupJob` |

### Mensuales (manuales)

- Verificar el espacio en disco del servidor y el crecimiento del volumen de fotos.
- Revisar los logs en busca de errores recurrentes.
- Verificar que el token de WhatsApp (si es temporal) no haya expirado.
- Verificar que el certificado SSL tenga mas de 30 dias de vigencia (si no usa Caddy o Let's Encrypt automatico).

### Trimestrales

- Revisar y actualizar las imagenes Docker base (`postgres:16-alpine`, `node:20-alpine`, `nginx:alpine`).
- Revisar dependencias de npm por vulnerabilidades (`npm audit`).
- Ejecutar un backup manual y verificar que la restauracion funciona en un entorno de prueba.

---

## Monitoreo recomendado

### Verificacion de salud de contenedores

```bash
# Ver estado de todos los servicios
docker-compose -f docker-compose.prod.yml ps

# Health checks configurados en docker-compose.prod.yml:
# - PostgreSQL: pg_isready cada 10s
# - Backend: GET /api/v1/health cada 30s
# - Frontend: GET / cada 30s
```

### Monitoreo de logs en tiempo real

```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Solo el backend
docker logs backend_node -f

# Solo errores
docker logs backend_node -f 2>&1 | grep '"level":50'
```

### Herramientas de monitoreo externas (opcionales)

| Herramienta | Tipo | Uso |
|---|---|---|
| [UptimeRobot](https://uptimerobot.com) | Uptime externo | Ping al health check cada 5 min |
| [Grafana + Loki](https://grafana.com) | Logs centralizados | Analisis de logs de contenedores |
| [Portainer](https://portainer.io) | UI para Docker | Gestion visual de contenedores |

**Endpoint a monitorear:**  
`GET https://preoperacional.sudominio.com/api/v1/health`  
Respuesta esperada: `{ "status": "ok" }` con HTTP 200.

---

## Gestion de espacio en disco

```bash
# Ver uso de volumenes Docker
docker system df -v

# Ver tamano especifico del volumen de fotos
docker run --rm -v uploads_data_preoperacional:/data alpine du -sh /data

# Ver tamano de logs de Docker
du -sh /var/lib/docker/containers/*/*-json.log | sort -rh | head -20
```

Los logs de contenedor estan configurados con rotacion automatica en produccion:
- Tamano maximo por archivo: 10 MB
- Maximo 3 archivos por contenedor

Si el disco esta lleno de forma inesperada:

```bash
# Limpiar imagenes, redes y contenedores no usados
docker system prune -f

# CUIDADO: esto elimina volumenes no usados (no hacerlo si hay datos importantes)
# docker system prune --volumes -f
```

---

## Renovacion del token de WhatsApp

Si el token de acceso de WhatsApp es temporal (generado desde la app de desarrolladores de Meta), expira en 24 horas. Para produccion se requiere un token de sistema permanente.

**Verificar si el token esta activo:**

```bash
curl -G "https://graph.facebook.com/v25.0/me" \
  --data-urlencode "access_token=EAAxxxxxxxxxxxxxxx"
```

Respuesta valida: `{ "id": "...", "name": "..." }`  
Respuesta de error: `{ "error": { "message": "Invalid OAuth access token..." } }`

**Renovar token permanente:**
1. Meta Business Suite > Configuracion del negocio > Usuarios del sistema.
2. Seleccionar el usuario del sistema.
3. Generar nuevo token con permiso `whatsapp_business_messaging`.
4. Actualizar `WHATSAPP_ACCESS_TOKEN` en el archivo `.env` del servidor.
5. Reiniciar el backend: `docker-compose -f docker-compose.prod.yml up -d backend_node`.

---

## Actualizacion de certificado SSL

Si usa Let's Encrypt con Certbot (sin renovacion automatica):

```bash
certbot renew --nginx
```

Si usa Caddy: la renovacion es completamente automatica, no requiere intervencion.

---

## Reinicio controlado del sistema

```bash
# Reinicio suave del backend (sin perder datos)
docker-compose -f docker-compose.prod.yml restart backend_node

# Reinicio completo de todos los servicios
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Actualizacion con rebuild
docker-compose -f docker-compose.prod.yml up -d --build
```
