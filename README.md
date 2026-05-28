# Preoperacional Propartes

Sistema de inspeccion preoperacional diaria de vehiculos para Propartes. Permite a los colaboradores registrar el estado de sus vehiculos (auto o moto) mediante una PWA instalable en dispositivos moviles, con un panel de administracion web para la gestion de colaboradores, visualizacion de inspecciones y configuracion del sistema.

## Caracteristicas principales

- PWA instalable en Android e iOS, sin registro ni contrasena para usuarios
- Formularios parametrizables por tipo de vehiculo (auto/moto) con secciones configurables desde el panel admin
- Captura de fotos con validacion EXIF (GPS y fecha) requerida el primer dia habil de cada semana
- Deteccion automatica del tipo de vehiculo por formato de placa
- Alertas automaticas por WhatsApp cuando un colaborador supera N dias habiles sin inspeccion
- Reporte diario por email con Excel adjunto (dias habiles a las 8:00 AM hora Bogota)
- Panel de administracion con autenticacion por magic link (sin contrasenas)
- Gestion de festivos colombianos calculados algoritmicamente con overrides manuales
- Exportacion de datos a Excel con filtros avanzados
- Cola offline: inspecciones guardadas localmente y enviadas automaticamente al recuperar conexion
- Clasificacion de colaboradores por frecuencia de inspeccion (diario / eventual)

## Stack tecnologico

- Frontend: React 19, Vite 5, Mantine UI v7, Recharts
- Backend: Node.js 20, Express 5, PostgreSQL 16
- Infraestructura: Docker, Docker Compose, Nginx
- Servicios externos: Resend (correo), Meta Cloud API (WhatsApp)

## Requisitos previos

- Docker 24+
- Docker Compose v2

## Levantar el proyecto

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd preoperacional_propartes

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 3. Construir e iniciar los servicios
docker-compose up --build

# 4. Verificar que funciona
# Frontend: http://localhost:5176
# Backend:  http://localhost:3006/api/v1/health
```

## Comandos de desarrollo

```bash
docker-compose up           # Iniciar todos los servicios
docker-compose up --build   # Reconstruir e iniciar
docker-compose down         # Detener todos los servicios
docker-compose logs -f      # Ver logs en tiempo real
docker-compose logs -f backend_node  # Logs solo del backend
```

## Primer acceso al panel de administracion

1. Ir a http://localhost:5176/admin/login
2. Ingresar el email definido en `INITIAL_SUPERADMIN_EMAIL` del archivo `.env`
3. Revisar el correo y hacer clic en el enlace de acceso
4. Acceder al dashboard

## Configuracion de Resend (correo)

1. Crear cuenta en resend.com
2. Ir a API Keys y crear una nueva clave
3. Ir a Domains y agregar el dominio (ej: propartes.com) con los registros DNS indicados
4. Configurar `RESEND_API_KEY` y `RESEND_FROM_EMAIL=noreply@tudominio.com`

Para pruebas sin dominio verificado: `RESEND_FROM_EMAIL=onboarding@resend.dev` (solo envia al email de la cuenta Resend)

## Configuracion de WhatsApp Business Cloud API

1. Crear app en developers.facebook.com (tipo Business) y agregar producto WhatsApp
2. Configurar un numero de telefono de WhatsApp Business
3. Crear la plantilla `alerta_inspeccion_pendiente`:
   - Categoria: UTILITY, Idioma: Espanol (es)
   - Variables en orden: nombre, cedula, dias_sin_inspeccion, placa
4. Esperar aprobacion de la plantilla (hasta 24 horas)
5. Configurar `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN`

Nota: usar token de sistema permanente en produccion (los tokens de prueba expiran en 24h)

## Comandos adicionales

```bash
# Conectarse a PostgreSQL
docker exec -it base_de_datos_postgresql psql -U preoperacional_user -d preoperacional_db

# Ejecutar migraciones manualmente
docker exec backend_node node src/migrate-cli.js up

# Backup de la base de datos
docker exec base_de_datos_postgresql pg_dump -U preoperacional_user preoperacional_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i base_de_datos_postgresql psql -U preoperacional_user -d preoperacional_db < backup.sql

# Backup del directorio de fotos
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads/

# Ejecutar tests del backend
docker exec backend_node npm test

# Agregar usuario administrador por BD
docker exec base_de_datos_postgresql psql -U preoperacional_user -d preoperacional_db \
  -c "INSERT INTO admin_users (email, name, role, is_active) VALUES ('nuevo@empresa.com', 'Nombre', 'admin', true);"
```

## Despliegue a produccion

```bash
# Configurar .env para produccion
APP_URL=https://tudominio.com
CORS_ORIGIN=https://tudominio.com
NODE_ENV=production

# Levantar con compose de produccion
docker-compose -f docker-compose.prod.yml up -d --build
```

En produccion: frontend como build estatico via Nginx, backend sin puertos expuestos al host, volumenes persistentes, reinicio automatico ante fallos, logs con rotacion automatica.

## Backups programados (crontab del servidor)

```bash
# Backup BD diario a las 2 AM
0 2 * * * docker exec base_de_datos_postgresql pg_dump -U preoperacional_user preoperacional_db > /backups/preop_$(date +\%Y\%m\%d).sql
# Backup fotos semanal
0 3 * * 0 tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /ruta/proyecto/uploads/
# Limpiar backups de mas de 30 dias
0 4 * * * find /backups -name "*.sql" -mtime +30 -delete
```

## API

Documentacion interactiva Swagger UI: http://localhost:3006/api/v1/docs

## Mantenimiento

- **Fotos**: eliminadas automaticamente a los 90 dias (job a las 2:00 AM hora Bogota)
- **Reporte email**: dias habiles a las 8:00 AM hora Bogota
- **Alertas WhatsApp**: check a las 11:00 AM hora Bogota en dias habiles; umbral configurable en panel admin
- **Festivos**: panel admin (superadmin) > Festivos para overrides manuales

## Resolucion de problemas

**El email de magic link no llega**: revisar spam, verificar dominio en resend.com, ver logs con `docker logs backend_node | grep auth`

**Las alertas de WhatsApp no se envian**: verificar plantilla aprobada en Meta Business, token no expirado, ver `docker logs backend_node | grep whatsapp`

**La PWA no se puede instalar**: requiere HTTPS en produccion; verificar manifest con `curl https://tudominio.com/manifest.json`

**Las migraciones fallan**: verificar que `DATABASE_URL` use `base_de_datos_postgresql` como host (no localhost)

**Backend no arranca (modulo no encontrado)**: reconstruir imagen con `docker-compose build backend_node`

## Estructura del proyecto

Ver [CLAUDE.md](CLAUDE.md) para la arquitectura detallada, endpoints, reglas de negocio y convenciones de codigo.
